import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Eye, EyeOff, Upload, Download, FileJson, AlertTriangle, Code, FileText, Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { validateFormConfigJSON, exportFormConfigToJSON, generateSampleFormConfig } from "@/utils/formConfigValidation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FormField {
  id: string;
  fieldType: string;
  label: string;
  placeholder?: string;
  required: boolean;
  requiredAtStage?: string[]; // Stages when this field is required: draft, submitted, review, approval, completed
  conditionalGroup?: string; // Group ID for "at least one required" logic
  conditionalDisplay?: {
    dependsOn: string; // field ID to watch
    showWhen: string[]; // value(s) that trigger display
  };
  options?: string[];
  helperText?: string;
  // Number validation properties
  min?: number;
  max?: number;
  step?: number;
}

interface FormSection {
  id: string;
  sectionTitle: string;
  fields: FormField[];
}

interface DocumentItem {
  id: string;
  name: string;
  description?: string;
  isMandatory: boolean;
  acceptedFileTypes: string[];
}

interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  documents: DocumentItem[];
}

interface FormConfig {
  metadata?: {
    version: string;
    createdAt: string;
    createdBy?: string;
    lastModifiedAt: string;
    lastModifiedBy?: string;
    versionNotes?: string;
  };
  sections: FormSection[];
  validationFields?: FormField[];
  requiredDocuments?: {
    categories: DocumentCategory[];
  };
}

interface Product {
  id: string;
  name: string;
  description: string | null;
}

// Sortable Document Component
const SortableDocument = ({
  document,
  documentIndex,
  categoryId,
  removeDocument,
  updateDocument,
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-md p-3 space-y-2 bg-muted/30"
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-xs font-medium">Document {documentIndex + 1}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeDocument(categoryId, document.id)}
          className="ml-auto"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Document Name</Label>
          <Input
            value={document.name}
            onChange={(e) =>
              updateDocument(categoryId, document.id, { name: e.target.value })
            }
            placeholder="e.g., Passport"
          />
        </div>

        <div>
          <Label>Description (Optional)</Label>
          <Textarea
            value={document.description || ""}
            onChange={(e) =>
              updateDocument(categoryId, document.id, { description: e.target.value })
            }
            placeholder="Brief description of this document"
            rows={2}
          />
        </div>

        <div>
          <Label>Accepted File Types (comma-separated)</Label>
          <Input
            value={document.acceptedFileTypes.join(", ")}
            onChange={(e) =>
              updateDocument(categoryId, document.id, {
                acceptedFileTypes: e.target.value.split(",").map((t) => t.trim()),
              })
            }
            placeholder="pdf, jpg, png"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={document.isMandatory}
            onCheckedChange={(checked) =>
              updateDocument(categoryId, document.id, { isMandatory: checked })
            }
          />
          <Label>Mandatory Document</Label>
        </div>
      </div>
    </div>
  );
};

// Sortable Category Component
const SortableCategory = ({
  category,
  categoryIndex,
  removeCategory,
  updateCategory,
  addDocument,
  removeDocument,
  updateDocument,
  handleDocumentDragEnd,
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-base">
            Category {categoryIndex + 1}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeCategory(category.id)}
            className="ml-auto"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Category Name</Label>
          <Input
            value={category.name}
            onChange={(e) =>
              updateCategory(category.id, { name: e.target.value })
            }
            placeholder="e.g., Personal Documents"
          />
        </div>

        <div>
          <Label>Category Description (Optional)</Label>
          <Textarea
            value={category.description || ""}
            onChange={(e) =>
              updateCategory(category.id, { description: e.target.value })
            }
            placeholder="Brief description of this category"
            rows={2}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Documents</Label>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDocumentDragEnd(category.id, e)}
          >
            <SortableContext
              items={category.documents.map((d: any) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              {category.documents.map((document: any, index: number) => (
                <SortableDocument
                  key={document.id}
                  document={document}
                  documentIndex={index}
                  categoryId={category.id}
                  removeDocument={removeDocument}
                  updateDocument={updateDocument}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => addDocument(category.id)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </CardContent>
    </Card>
  );
};

// Sortable Field Component
const SortableField = ({
  field,
  fieldIndex,
  sectionId,
  removeField,
  updateField,
  fieldTypes,
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-md p-3 space-y-2 bg-muted/30"
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-xs font-medium">Field {fieldIndex + 1}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeField(sectionId, field.id)}
          className="ml-auto"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Field Type</Label>
          <Select
            value={field.fieldType}
            onValueChange={(value) =>
              updateField(sectionId, field.id, { fieldType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map((type: any) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Field Label</Label>
          <Input
            value={field.label}
            onChange={(e) =>
              updateField(sectionId, field.id, { label: e.target.value })
            }
            placeholder="e.g., Business Name"
          />
        </div>

        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder || ""}
            onChange={(e) =>
              updateField(sectionId, field.id, {
                placeholder: e.target.value,
              })
            }
            placeholder="e.g., Enter your business name"
          />
        </div>

        <div className="flex items-center gap-2 pt-4">
          <Switch
            checked={field.required}
            onCheckedChange={(checked) =>
              updateField(sectionId, field.id, { required: checked })
            }
          />
          <Label className="text-xs">Required Field</Label>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <Label className="text-xs font-semibold">Stage-Based Requirements</Label>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Required at stages:</Label>
          <div className="flex flex-wrap gap-2">
            {['predraft', 'draft', 'submitted', 'returned', 'rejected', 'completed', 'paid'].map((stage) => (
              <div key={stage} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.id}-${stage}`}
                  checked={field.requiredAtStage?.includes(stage) || false}
                  onCheckedChange={(checked) => {
                    const currentStages = field.requiredAtStage || [];
                    const newStages = checked
                      ? [...currentStages, stage]
                      : currentStages.filter((s: string) => s !== stage);
                    updateField(sectionId, field.id, { requiredAtStage: newStages });
                  }}
                />
                <Label htmlFor={`${field.id}-${stage}`} className="text-xs capitalize cursor-pointer">
                  {stage}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Conditional Group (optional)</Label>
          <Input
            value={field.conditionalGroup || ""}
            onChange={(e) =>
              updateField(sectionId, field.id, {
                conditionalGroup: e.target.value,
              })
            }
            placeholder="e.g., contact-info (at least one field from this group required)"
            className="text-xs"
          />
        </div>
      </div>

      <div>
        <Label>Helper Text</Label>
        <Input
          value={field.helperText || ""}
          onChange={(e) =>
            updateField(sectionId, field.id, {
              helperText: e.target.value,
            })
          }
          placeholder="Additional information for this field"
        />
      </div>

      {(field.fieldType === "select" || field.fieldType === "radio") && (
        <div>
          <Label>Options (comma-separated)</Label>
          <Textarea
            value={field.options?.join(", ") || ""}
            onChange={(e) =>
              updateField(sectionId, field.id, {
                options: e.target.value.split(",").map((s) => s.trim()),
              })
            }
            placeholder="Option 1, Option 2, Option 3"
            rows={2}
          />
        </div>
      )}

      {/* Conditional Display Configuration */}
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs font-semibold flex items-center gap-2">
          <span>Conditional Display (optional)</span>
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          Show this field only when another field has specific value(s)
        </p>
        
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Depends On Field ID</Label>
            <Input
              value={field.conditionalDisplay?.dependsOn || ""}
              onChange={(e) => {
                const dependsOn = e.target.value;
                updateField(sectionId, field.id, {
                  conditionalDisplay: dependsOn
                    ? {
                        dependsOn,
                        showWhen: field.conditionalDisplay?.showWhen || [],
                      }
                    : undefined,
                });
              }}
              placeholder="e.g., employment-type"
              className="text-xs"
            />
          </div>
          
          {field.conditionalDisplay?.dependsOn && (
            <div>
              <Label className="text-xs">Show When (comma-separated values)</Label>
              <Input
                value={field.conditionalDisplay?.showWhen?.join(", ") || ""}
                onChange={(e) => {
                  const showWhen = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s);
                  updateField(sectionId, field.id, {
                    conditionalDisplay: {
                      dependsOn: field.conditionalDisplay!.dependsOn,
                      showWhen,
                    },
                  });
                }}
                placeholder="e.g., Salaried, Self-Employed"
                className="text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Field will be visible when parent field equals any of these values
              </p>
            </div>
          )}
        </div>
      </div>

      {field.fieldType === "number" && (
        <div className="space-y-2 border-t pt-2">
          <Label className="text-xs font-semibold">Number Validation</Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Min Value</Label>
              <Input
                type="number"
                value={field.min !== undefined ? field.min : ""}
                onChange={(e) =>
                  updateField(sectionId, field.id, {
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="e.g., 0"
              />
            </div>
            <div>
              <Label className="text-xs">Max Value</Label>
              <Input
                type="number"
                value={field.max !== undefined ? field.max : ""}
                onChange={(e) =>
                  updateField(sectionId, field.id, {
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <Label className="text-xs">Step</Label>
              <Input
                type="number"
                value={field.step !== undefined ? field.step : ""}
                onChange={(e) =>
                  updateField(sectionId, field.id, {
                    step: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="e.g., 1"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Set min to 1 for positive numbers, 0 for non-negative numbers
          </p>
        </div>
      )}
    </div>
  );
};

// Sortable Section Component
const SortableSection = ({
  section,
  sectionIndex,
  updateSection,
  removeSection,
  addField,
  removeField,
  updateField,
  fieldTypes,
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = section.fields.findIndex((f: FormField) => f.id === active.id);
      const newIndex = section.fields.findIndex((f: FormField) => f.id === over.id);
      
      const reorderedFields = arrayMove(section.fields, oldIndex, newIndex);
      updateSection(section.id, section.sectionTitle, reorderedFields);
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            value={section.sectionTitle}
            onChange={(e) => updateSection(section.id, e.target.value, section.fields)}
            className="flex-1 font-semibold text-sm h-8"
            placeholder="Section Title"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeSection(section.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleFieldDragEnd}
        >
          <SortableContext
            items={section.fields.map((f: FormField) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.fields.map((field: FormField, fieldIndex: number) => (
              <SortableField
                key={field.id}
                field={field}
                fieldIndex={fieldIndex}
                sectionId={section.id}
                removeField={removeField}
                updateField={updateField}
                fieldTypes={fieldTypes}
              />
            ))}
          </SortableContext>
        </DndContext>

        <Button
          variant="outline"
          size="sm"
          onClick={() => addField(section.id)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </CardContent>
    </Card>
  );
};

// Preview Component
const FormPreview = ({ formConfig, currentStage = 'draft' }: { formConfig: FormConfig; currentStage?: string }) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditionalDisplay) return true;
    
    const { dependsOn, showWhen } = field.conditionalDisplay;
    const parentValue = formValues[dependsOn];
    
    return showWhen.includes(parentValue);
  };

  const getStageIndicator = (field: FormField) => {
    const requiredAtStage = field.requiredAtStage || [];
    const requiredNow = requiredAtStage.includes(currentStage);
    const requiredLater = requiredAtStage.length > 0 && !requiredNow;
    
    if (requiredNow) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
          Required Now
        </span>
      );
    } else if (requiredLater) {
      const nextStage = requiredAtStage[0];
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
          Required at: {nextStage}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="text-lg font-semibold">Form Preview</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Stage:</span>
          <span className="text-sm font-medium capitalize px-2 py-1 bg-primary/10 rounded-md">{currentStage}</span>
        </div>
      </div>
      
      {formConfig.sections.length === 0 && (!formConfig.requiredDocuments || formConfig.requiredDocuments.categories.length === 0) ? (
        <div className="text-center py-12 text-muted-foreground">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No sections or documents configured yet.</p>
        </div>
      ) : (
        <>
          {formConfig.sections.map((section) => (
          <div key={section.id} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                {section.sectionTitle}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.filter(shouldShowField).map((field) => (
                <div
                  key={field.id}
                  className={
                    field.fieldType === "textarea" ? "md:col-span-2" : ""
                  }
                >
                  <div className="flex items-center justify-between mb-1">
                    <Label>
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                      {field.conditionalGroup && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Group: {field.conditionalGroup})
                        </span>
                      )}
                      {field.conditionalDisplay && (
                        <span className="text-xs text-orange-500 ml-2">
                          (Shows when: {field.conditionalDisplay.dependsOn} = {field.conditionalDisplay.showWhen.join(" or ")})
                        </span>
                      )}
                    </Label>
                    {getStageIndicator(field)}
                  </div>
                  
                  {field.fieldType === "text" && (
                    <Input placeholder={field.placeholder} disabled />
                  )}
                  
                  {field.fieldType === "number" && (
                    <Input type="number" placeholder={field.placeholder} disabled />
                  )}
                  
                  {field.fieldType === "email" && (
                    <Input type="email" placeholder={field.placeholder} disabled />
                  )}
                  
                  {field.fieldType === "tel" && (
                    <Input type="tel" placeholder={field.placeholder} disabled />
                  )}
                  
                  {field.fieldType === "textarea" && (
                    <Textarea placeholder={field.placeholder} disabled rows={3} />
                  )}
                  
                  {field.fieldType === "select" && (
                    <Select
                      value={formValues[field.id] || ""}
                      onValueChange={(value) =>
                        setFormValues((prev) => ({ ...prev, [field.id]: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || "Select an option"} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option, idx) => (
                          <SelectItem key={idx} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {field.fieldType === "date" && (
                    <Input type="date" placeholder={field.placeholder} disabled />
                  )}
                  
                  {field.fieldType === "checkbox" && (
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox disabled />
                      <span className="text-sm">{field.placeholder || field.label}</span>
                    </div>
                  )}
                  
                  {field.fieldType === "radio" && (
                    <RadioGroup
                      value={formValues[field.id] || ""}
                      onValueChange={(value) =>
                        setFormValues((prev) => ({ ...prev, [field.id]: value }))
                      }
                    >
                      {field.options?.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <RadioGroupItem value={option} id={`${field.id}-${idx}`} />
                          <Label htmlFor={`${field.id}-${idx}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  
                  {field.helperText && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {field.helperText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {formConfig.requiredDocuments && formConfig.requiredDocuments.categories.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold">Required Documents</h3>
            {formConfig.requiredDocuments.categories.map((category) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary/70 rounded-full" />
                  <h4 className="font-medium text-sm">{category.name}</h4>
                </div>
                {category.description && (
                  <p className="text-xs text-muted-foreground pl-3">{category.description}</p>
                )}
                <div className="pl-3 space-y-2">
                  {category.documents.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/20">
                      <Checkbox disabled className="mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{doc.name}</span>
                          {doc.isMandatory && (
                            <span className="text-xs text-destructive">*Required</span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Accepted: {doc.acceptedFileTypes.join(", ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </>
      )}
    </div>
  );
};

const ServiceFormConfiguration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [formConfig, setFormConfig] = useState<FormConfig>({ 
    sections: [],
    validationFields: [],
    requiredDocuments: { categories: [] }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"fields" | "validation" | "documents">("fields");
  const [currentStage, setCurrentStage] = useState<string>("draft");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [editMode, setEditMode] = useState<"visual" | "manual" | null>(null);
  
  // Template management state
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showLoadTemplateDialog, setShowLoadTemplateDialog] = useState(false);
  const [showVersionHistoryDialog, setShowVersionHistoryDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [changeNotes, setChangeNotes] = useState("");
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [showValidationPreview, setShowValidationPreview] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);

  // Batch add ECT validation field to all services
  const handleBatchAddValidationFields = async () => {
    setBatchUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('batch-add-validation-fields', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: "Batch Update Complete",
        description: `Updated ${data.summary?.success || 0} services, skipped ${data.summary?.skipped || 0}`,
      });

      // Refresh current config if a product is selected
      if (selectedProductId) {
        fetchFormConfig();
      }
    } catch (error: any) {
      console.error('Batch update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to batch update configurations",
        variant: "destructive",
      });
    } finally {
      setBatchUpdating(false);
    }
  };

  // JSON Snippet Injector state
  const [showSnippetDialog, setShowSnippetDialog] = useState(false);
  const [snippetJSON, setSnippetJSON] = useState("");
  const [snippetType, setSnippetType] = useState<"section" | "field" | "document_category" | "validation_field">("section");
  const [applyTo, setApplyTo] = useState<"current" | "all">("current");
  const [snippetApplying, setSnippetApplying] = useState(false);
  const [snippetError, setSnippetError] = useState<string | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string>("");

  // Apply JSON snippet to config(s)
  const handleApplySnippet = async () => {
    setSnippetError(null);
    
    // Validate JSON
    let parsedSnippet: any;
    try {
      parsedSnippet = JSON.parse(snippetJSON);
    } catch (e) {
      setSnippetError("Invalid JSON format. Please check your input.");
      return;
    }

    setSnippetApplying(true);
    
    try {
      if (applyTo === "current") {
        // Apply to currently selected product only
        if (!selectedProductId) {
          setSnippetError("Please select a product first");
          setSnippetApplying(false);
          return;
        }
        
        await applySnippetToProduct(selectedProductId, parsedSnippet);
        toast({
          title: "Success",
          description: "Snippet applied to current service",
        });
        fetchFormConfig(); // Refresh
      } else {
        // Apply to all products
        const { data: configs, error } = await supabase
          .from('service_form_configurations')
          .select('id, product_id, form_config, products!inner(name)');
        
        if (error) throw error;
        
        let successCount = 0;
        let skipCount = 0;
        
        for (const config of configs || []) {
          try {
            const updated = await applySnippetToProduct(config.product_id, parsedSnippet, config);
            if (updated) successCount++;
            else skipCount++;
          } catch (err) {
            console.error(`Error applying to ${(config as any).products?.name}:`, err);
            skipCount++;
          }
        }
        
        toast({
          title: "Batch Apply Complete",
          description: `Applied to ${successCount} services, skipped ${skipCount}`,
        });
        
        if (selectedProductId) fetchFormConfig();
      }
      
      setShowSnippetDialog(false);
      setSnippetJSON("");
    } catch (error: any) {
      console.error('Snippet apply error:', error);
      setSnippetError(error.message || "Failed to apply snippet");
    } finally {
      setSnippetApplying(false);
    }
  };

  const applySnippetToProduct = async (productId: string, snippet: any, existingConfig?: any) => {
    // Fetch current config if not provided
    let currentFormConfig: any;
    if (existingConfig) {
      currentFormConfig = existingConfig.form_config;
    } else {
      const { data } = await supabase
        .from('service_form_configurations')
        .select('form_config')
        .eq('product_id', productId)
        .single();
      currentFormConfig = data?.form_config || { sections: [], requiredDocuments: { categories: [] } };
    }

    let updatedConfig = { ...currentFormConfig };
    
    if (snippetType === "section") {
      // Check if section with same ID already exists
      const existingSectionIds = (updatedConfig.sections || []).map((s: any) => s.id);
      if (snippet.id && existingSectionIds.includes(snippet.id)) {
        // Replace existing section
        updatedConfig.sections = updatedConfig.sections.map((s: any) => 
          s.id === snippet.id ? snippet : s
        );
      } else {
        // Add new section
        updatedConfig.sections = [...(updatedConfig.sections || []), snippet];
      }
    } else if (snippetType === "field") {
      // Add field to selected section or first section
      if (updatedConfig.sections && updatedConfig.sections.length > 0) {
        const sectionIndex = targetSectionId 
          ? updatedConfig.sections.findIndex((s: any) => s.id === targetSectionId)
          : 0;
        const targetSection = updatedConfig.sections[sectionIndex >= 0 ? sectionIndex : 0];
        
        if (targetSection) {
          const existingFieldIds = (targetSection.fields || []).map((f: any) => f.id);
          if (snippet.id && existingFieldIds.includes(snippet.id)) {
            // Replace existing field
            targetSection.fields = targetSection.fields.map((f: any) => 
              f.id === snippet.id ? snippet : f
            );
          } else {
            targetSection.fields = [...(targetSection.fields || []), snippet];
          }
        }
      }
    } else if (snippetType === "document_category") {
      if (!updatedConfig.requiredDocuments) {
        updatedConfig.requiredDocuments = { categories: [] };
      }
      const existingCategoryIds = updatedConfig.requiredDocuments.categories.map((c: any) => c.id);
      if (snippet.id && existingCategoryIds.includes(snippet.id)) {
        updatedConfig.requiredDocuments.categories = updatedConfig.requiredDocuments.categories.map((c: any) =>
          c.id === snippet.id ? snippet : c
        );
      } else {
        updatedConfig.requiredDocuments.categories = [...updatedConfig.requiredDocuments.categories, snippet];
      }
    } else if (snippetType === "validation_field") {
      // Add to top-level validationFields array (not inside any section)
      if (!updatedConfig.validationFields) {
        updatedConfig.validationFields = [];
      }
      const existingFieldIds = updatedConfig.validationFields.map((f: any) => f.id);
      if (snippet.id && existingFieldIds.includes(snippet.id)) {
        // Replace existing validation field
        updatedConfig.validationFields = updatedConfig.validationFields.map((f: any) =>
          f.id === snippet.id ? snippet : f
        );
      } else {
        updatedConfig.validationFields = [...updatedConfig.validationFields, snippet];
      }
    }

    // Upsert the config
    const { error } = await supabase
      .from('service_form_configurations')
      .upsert({
        product_id: productId,
        form_config: updatedConfig,
        updated_at: new Date().toISOString()
      }, { onConflict: 'product_id' });

    if (error) throw error;
    return true;
  };

  // Available stages
  const stages = ['draft', 'submitted', 'review', 'approval', 'completed'];

  // Field type options
  const fieldTypes = [
    { value: "text", label: "Text Input" },
    { value: "number", label: "Number Input" },
    { value: "email", label: "Email Input" },
    { value: "tel", label: "Phone Input" },
    { value: "textarea", label: "Text Area" },
    { value: "select", label: "Select Dropdown" },
    { value: "date", label: "Date Picker" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio Buttons" },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch config when product changes
  useEffect(() => {
    if (selectedProductId) {
      fetchFormConfig();
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
  };

  const fetchFormConfig = async () => {
    setLoading(true);
    // Clear any previous import errors/warnings
    setImportErrors([]);
    setImportWarnings([]);
    
    const { data, error } = await supabase
      .from("service_form_configurations")
      .select("form_config")
      .eq("product_id", selectedProductId)
      .single();

    if (error && error.code !== "PGRST116") {
      toast({
        title: "Error",
        description: "Failed to fetch form configuration",
        variant: "destructive",
      });
    } else if (data && data.form_config) {
      const config = data.form_config as any;
      setFormConfig({
        sections: config.sections || [],
        validationFields: config.validationFields || [],
        requiredDocuments: config.requiredDocuments || { categories: [] }
      });
    } else {
      setFormConfig({ 
        sections: [],
        validationFields: [],
        requiredDocuments: { categories: [] }
      });
    }
    setLoading(false);
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      sectionTitle: "New Section",
      fields: [],
    };
    setFormConfig((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const removeSection = (sectionId: string) => {
    setFormConfig((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
  };

  const updateSection = (sectionId: string, title: string, fields?: FormField[]) => {
    setFormConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, sectionTitle: title, ...(fields && { fields }) }
          : s
      ),
    }));
  };

  const addField = (sectionId: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      fieldType: "text",
      label: "New Field",
      placeholder: "",
      required: false,
      helperText: "",
    };

    setFormConfig((prev) => ({
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: [...s.fields, newField] }
          : s
      ),
    }));
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setFormConfig((prev) => ({
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          : s
      ),
    }));
  };

  const updateField = (
    sectionId: string,
    fieldId: string,
    updates: Partial<FormField>
  ) => {
    setFormConfig((prev) => ({
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f
              ),
            }
          : s
      ),
    }));
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormConfig((prev) => {
        const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
        const newIndex = prev.sections.findIndex((s) => s.id === over.id);

        return {
          ...prev,
          sections: arrayMove(prev.sections, oldIndex, newIndex),
        };
      });
    }
  };

  // Document Category Management
  const addCategory = () => {
    const newCategory: DocumentCategory = {
      id: `category_${Date.now()}`,
      name: "New Category",
      description: "",
      documents: [],
    };
    setFormConfig((prev) => ({
      ...prev,
      requiredDocuments: {
        categories: [...(prev.requiredDocuments?.categories || []), newCategory],
      },
    }));
  };

  const removeCategory = (categoryId: string) => {
    setFormConfig((prev) => ({
      ...prev,
      requiredDocuments: {
        categories: prev.requiredDocuments?.categories.filter((c) => c.id !== categoryId) || [],
      },
    }));
  };

  const updateCategory = (categoryId: string, updates: Partial<DocumentCategory>) => {
    setFormConfig((prev) => ({
      ...prev,
      requiredDocuments: {
        categories: prev.requiredDocuments?.categories.map((c) =>
          c.id === categoryId ? { ...c, ...updates } : c
        ) || [],
      },
    }));
  };

  const addDocument = (categoryId: string) => {
    const newDocument: DocumentItem = {
      id: `doc_${Date.now()}`,
      name: "New Document",
      description: "",
      isMandatory: true,
      acceptedFileTypes: ["pdf", "jpg", "png"],
    };
    setFormConfig((prev) => ({
      ...prev,
      requiredDocuments: {
        categories: prev.requiredDocuments?.categories.map((c) =>
          c.id === categoryId
            ? { ...c, documents: [...c.documents, newDocument] }
            : c
        ) || [],
      },
    }));
  };

  const removeDocument = (categoryId: string, documentId: string) => {
    setFormConfig((prev) => ({
      ...prev,
      requiredDocuments: {
        categories: prev.requiredDocuments?.categories.map((c) =>
          c.id === categoryId
            ? { ...c, documents: c.documents.filter((d) => d.id !== documentId) }
            : c
        ) || [],
      },
    }));
  };

  const updateDocument = (
    categoryId: string,
    documentId: string,
    updates: Partial<DocumentItem>
  ) => {
    setFormConfig((prev) => ({
      ...prev,
      requiredDocuments: {
        categories: prev.requiredDocuments?.categories.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                documents: c.documents.map((d) =>
                  d.id === documentId ? { ...d, ...updates } : d
                ),
              }
            : c
        ) || [],
      },
    }));
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormConfig((prev) => {
        const categories = prev.requiredDocuments?.categories || [];
        const oldIndex = categories.findIndex((c) => c.id === active.id);
        const newIndex = categories.findIndex((c) => c.id === over.id);

        return {
          ...prev,
          requiredDocuments: {
            categories: arrayMove(categories, oldIndex, newIndex),
          },
        };
      });
    }
  };

  const handleDocumentDragEnd = (categoryId: string, event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormConfig((prev) => ({
        ...prev,
        requiredDocuments: {
          categories: prev.requiredDocuments?.categories.map((c) => {
            if (c.id === categoryId) {
              const oldIndex = c.documents.findIndex((d) => d.id === active.id);
              const newIndex = c.documents.findIndex((d) => d.id === over.id);
              return {
                ...c,
                documents: arrayMove(c.documents, oldIndex, newIndex),
              };
            }
            return c;
          }) || [],
        },
      }));
    }
  };

  const saveConfiguration = async () => {
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("service_form_configurations")
      .upsert({
        product_id: selectedProductId,
        form_config: formConfig as any,
      } as any, {
        onConflict: 'product_id'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Form configuration saved successfully",
      });
      
      // Create version history entry
      if (user) {
        await createVersionEntry(user.id);
      }
    }
    setSaving(false);
  };

  // Create version history entry
  const createVersionEntry = async (userId: string) => {
    try {
      // Get next version number
      const { data: versionData, error: versionError } = await supabase
        .rpc('get_next_version_number', { p_product_id: selectedProductId });

      if (versionError) throw versionError;

      const nextVersion = versionData || 1;

      // Insert version entry
      const { error: insertError } = await supabase
        .from('form_configuration_versions')
        .insert({
          product_id: selectedProductId,
          version_number: nextVersion,
          config_data: formConfig as any,
          changed_by: userId,
          change_notes: changeNotes || 'Configuration updated'
        } as any);

      if (insertError) throw insertError;

      // Reset change notes
      setChangeNotes("");
    } catch (error) {
      console.error('Error creating version entry:', error);
    }
  };

  // Handle JSON file import
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const validation = validateFormConfigJSON(jsonData);

        setImportErrors(validation.errors);
        setImportWarnings(validation.warnings);

        if (validation.isValid && validation.data) {
          setFormConfig(validation.data);
          
          // Show version info if available
          if (jsonData.metadata) {
            const meta = jsonData.metadata;
            toast({
              title: "Configuration Imported",
              description: `Version ${meta.version} (Created: ${new Date(meta.createdAt).toLocaleDateString()})${validation.warnings.length > 0 ? ' with warnings' : ''}`,
            });
          } else {
            toast({
              title: "Success",
              description: "Configuration imported successfully" + (validation.warnings.length > 0 ? " (with warnings)" : ""),
            });
          }
          
          setShowImportDialog(false);
        } else {
          toast({
            title: "Validation Failed",
            description: `Found ${validation.errors.length} error(s)`,
            variant: "destructive",
          });
        }
      } catch (error) {
        setImportErrors([`Invalid JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        toast({
          title: "Error",
          description: "Failed to parse JSON file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Export configuration as JSON
  const handleExportJSON = async () => {
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.user_metadata?.name || user?.email || "Unknown";

    const { filename, content } = exportFormConfigToJSON(
      selectedProduct.name,
      formConfig,
      userName
    );

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Configuration exported successfully",
    });
  };

  // Fetch templates
  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('form_templates')
      .select('*, created_by:profiles(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return;
    }

    setTemplates(data || []);
  };

  // Fetch version history
  const fetchVersionHistory = async () => {
    if (!selectedProductId) return;

    const { data, error } = await supabase
      .from('form_configuration_versions')
      .select('*, changed_by:profiles(name)')
      .eq('product_id', selectedProductId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching versions:', error);
      return;
    }

    setVersions(data || []);
  };

  // Save as template
  const handleSaveAsTemplate = async () => {
    if (!selectedProductId || !templateName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a template name",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('form_templates')
      .insert({
        name: templateName,
        description: templateDescription,
        product_id: selectedProductId,
        template_config: formConfig as any,
        created_by: user.id
      } as any);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Template saved successfully",
    });

    setShowSaveTemplateDialog(false);
    setTemplateName("");
    setTemplateDescription("");
    fetchTemplates();
  };

  // Load template
  const handleLoadTemplate = (template: any) => {
    setFormConfig(template.template_config);
    setShowLoadTemplateDialog(false);
    toast({
      title: "Success",
      description: `Template "${template.name}" loaded`,
    });
  };

  // Restore version
  const handleRestoreVersion = async (version: any) => {
    setFormConfig(version.config_data);
    setShowVersionHistoryDialog(false);
    
    toast({
      title: "Version Restored",
      description: `Restored to version ${version.version_number}. Click Save to apply.`,
    });
  };

  // Download sample JSON template
  const handleDownloadSample = () => {
    const sampleConfig = generateSampleFormConfig();
    const { filename, content } = exportFormConfigToJSON(
      "Sample Service",
      sampleConfig,
      "System"
    );

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Sample template downloaded",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/customer-services")}
                className="gap-2 h-8"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Service Details Form Configuration</h1>
                <p className="text-xs text-muted-foreground">
                  Configure forms, drag to reorder
                </p>
              </div>
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex flex-wrap gap-2 items-center text-xs">
              {/* Template Actions */}
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-muted-foreground font-medium">Templates:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLoadTemplateDialog(true);
                    fetchTemplates();
                  }}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Upload className="h-3 w-3" />
                  Load
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveTemplateDialog(true)}
                  disabled={!selectedProductId}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Save className="h-3 w-3" />
                  Save as
                </Button>
              </div>

              <Separator orientation="vertical" className="h-5" />

              {/* Version Control */}
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-muted-foreground font-medium">Version:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowVersionHistoryDialog(true);
                    fetchVersionHistory();
                  }}
                  disabled={!selectedProductId}
                  className="gap-1.5 h-7 text-xs"
                >
                  <FileJson className="h-3 w-3" />
                  History
                </Button>
              </div>

              <Separator orientation="vertical" className="h-5" />

              {/* Import/Export */}
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-muted-foreground font-medium">JSON:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Download className="h-3 w-3" />
                  Sample
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateLibrary(true)}
                  disabled={!selectedProductId}
                  className="gap-1.5 h-7 text-xs"
                >
                  <FileText className="h-3 w-3" />
                  Templates
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportDialog(true)}
                  disabled={!selectedProductId}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Upload className="h-3 w-3" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  disabled={!selectedProductId}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Download className="h-3 w-3" />
                  Export
                </Button>
              </div>

              <Separator orientation="vertical" className="h-5" />

              {/* Admin: Migrate Validation Fields */}
              <div className="flex gap-1.5 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowValidationPreview(true)}
                  className="gap-1.5 h-7 text-xs border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBatchAddValidationFields}
                  disabled={batchUpdating}
                  className="gap-1.5 h-7 text-xs bg-amber-600 hover:bg-amber-700"
                >
                  {batchUpdating ? "Migrating..." : "Migrate Validation Fields"}
                </Button>
              </div>
              
              {/* JSON Snippet Injector */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSnippetDialog(true)}
                className="gap-1.5 h-7 text-xs border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Code className="h-3 w-3" />
                Inject JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 space-y-4">
        {!loading && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Product / Service</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productSearchOpen}
                    className="w-full justify-between h-9 font-normal"
                  >
                    {selectedProductId
                      ? products.find((product) => product.id === selectedProductId)?.name
                      : "Select a product to configure..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 z-50" align="start">
                  <Command>
                    <CommandInput placeholder="Search products..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {products.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={product.name}
                            onSelect={() => {
                              setSelectedProductId(product.id);
                              setProductSearchOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedProductId === product.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {product.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {(importErrors.length > 0 || importWarnings.length > 0) && (
                <div className="space-y-2">
                  {importErrors.length > 0 && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <AlertTitle className="text-sm">Errors</AlertTitle>
                      <AlertDescription className="text-xs">
                        {importErrors.map((e, i) => <div key={i}>{e}</div>)}
                      </AlertDescription>
                    </Alert>
                  )}
                  {importWarnings.length > 0 && (
                    <Alert className="border-yellow-500/30 bg-yellow-500/5 py-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <AlertTitle className="text-sm">Warnings</AlertTitle>
                      <AlertDescription className="text-xs">
                        {importWarnings.map((w, i) => <div key={i}>{w}</div>)}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Version Info Display */}
              {formConfig?.metadata && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-primary" />
                      Configuration Version
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Version:</span>
                      <span className="font-semibold text-primary">{formConfig.metadata.version}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Last Modified:</span>
                      <span className="font-medium">{new Date(formConfig.metadata.lastModifiedAt).toLocaleString()}</span>
                    </div>
                    {formConfig.metadata.lastModifiedBy && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Modified By:</span>
                        <span className="font-medium">{formConfig.metadata.lastModifiedBy}</span>
                      </div>
                    )}
                    {formConfig.metadata.versionNotes && (
                      <div className="mt-3 pt-3 border-t border-primary/20">
                        <span className="text-muted-foreground font-medium">Notes:</span>
                        <p className="mt-1 text-xs bg-background/50 rounded p-2 border">{formConfig.metadata.versionNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {selectedProductId && !editMode && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Editing Mode</CardTitle>
              <p className="text-sm text-muted-foreground">Select how you want to configure this service</p>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setEditMode("visual")}>
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <GripVertical className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Visual Editor</h3>
                    <p className="text-xs text-muted-foreground">Drag-and-drop interface to build forms visually</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setEditMode("manual")}>
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Manual JSON Editor</h3>
                    <p className="text-xs text-muted-foreground">Edit configuration directly as JSON code</p>
                  </div>
                </CardContent>
              </Card>

            </CardContent>
          </Card>
        )}

        {selectedProductId && editMode === "visual" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">Visual Editor</h2>
                <p className="text-sm text-muted-foreground">Drag and drop to configure your form</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditMode(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Mode Selection
              </Button>
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "fields" | "validation" | "documents")} className="space-y-6">
              <TabsList className="grid w-full max-w-2xl grid-cols-3 h-11">
                <TabsTrigger value="fields" className="gap-2">
                  <GripVertical className="h-4 w-4" />
                  Form Fields
                </TabsTrigger>
                <TabsTrigger value="validation" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Validation Fields
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <FileJson className="h-4 w-4" />
                  Required Documents
                </TabsTrigger>
              </TabsList>

            <TabsContent value="fields" className="mt-6">
              <div className={showPreview ? "grid grid-cols-2 gap-6" : "space-y-4"}>
                <div className="space-y-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSectionDragEnd}
                  >
                    <SortableContext
                      items={formConfig.sections.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {formConfig.sections.map((section, sectionIndex) => (
                        <SortableSection
                          key={section.id}
                          section={section}
                          sectionIndex={sectionIndex}
                          updateSection={updateSection}
                          removeSection={removeSection}
                          addField={addField}
                          removeField={removeField}
                          updateField={updateField}
                          fieldTypes={fieldTypes}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  <Button onClick={addSection} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>

                  {/* Version Notes */}
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="pt-6 space-y-3">
                      <Label className="text-sm font-medium">Version Notes (Optional)</Label>
                      <Textarea
                        value={changeNotes}
                        onChange={(e) => setChangeNotes(e.target.value)}
                        placeholder="Describe what changed in this version..."
                        rows={2}
                        className="resize-none"
                      />
                    </CardContent>
                  </Card>
                </div>

                {showPreview && (
                  <div className="space-y-4 sticky top-6 h-fit">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Form Preview
                          </div>
                          <Select value={currentStage} onValueChange={setCurrentStage}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map((stage) => (
                                <SelectItem key={stage} value={stage} className="capitalize text-xs">
                                  {stage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FormPreview formConfig={formConfig} currentStage={currentStage} />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="validation" className="mt-6">
              <div className="space-y-4">
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Validation-Only Fields
                    </CardTitle>
                    <CardDescription className="text-xs">
                      These fields are not displayed in the application form but are validated at specific workflow stages (e.g., estimated completion time, risk assessment).
                    </CardDescription>
                  </CardHeader>
                </Card>

                {formConfig.validationFields && formConfig.validationFields.length > 0 ? (
                  <div className="space-y-3">
                    {formConfig.validationFields.map((field, index) => (
                      <Card key={field.id} className="border-l-4 border-l-amber-500">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Field Label</Label>
                                  <Input
                                    value={field.label}
                                    onChange={(e) => {
                                      const updatedFields = [...(formConfig.validationFields || [])];
                                      updatedFields[index] = { ...field, label: e.target.value };
                                      setFormConfig({ ...formConfig, validationFields: updatedFields });
                                    }}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Field Type</Label>
                                  <Select
                                    value={field.fieldType}
                                    onValueChange={(value) => {
                                      const updatedFields = [...(formConfig.validationFields || [])];
                                      updatedFields[index] = { ...field, fieldType: value };
                                      setFormConfig({ ...formConfig, validationFields: updatedFields });
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {fieldTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs">Required At Stage(s)</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {stages.map((stage) => (
                                    <label key={stage} className="flex items-center gap-1.5 cursor-pointer">
                                      <Checkbox
                                        checked={field.requiredAtStage?.includes(stage)}
                                        onCheckedChange={(checked) => {
                                          const updatedFields = [...(formConfig.validationFields || [])];
                                          const currentStages = field.requiredAtStage || [];
                                          updatedFields[index] = {
                                            ...field,
                                            requiredAtStage: checked
                                              ? [...currentStages, stage]
                                              : currentStages.filter((s) => s !== stage),
                                          };
                                          setFormConfig({ ...formConfig, validationFields: updatedFields });
                                        }}
                                        className="h-3 w-3"
                                      />
                                      <span className="text-xs capitalize">{stage}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={field.required}
                                  onCheckedChange={(checked) => {
                                    const updatedFields = [...(formConfig.validationFields || [])];
                                    updatedFields[index] = { ...field, required: !!checked };
                                    setFormConfig({ ...formConfig, validationFields: updatedFields });
                                  }}
                                  className="h-3 w-3"
                                />
                                <Label className="text-xs">Required (Base)</Label>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedFields = (formConfig.validationFields || []).filter((_, i) => i !== index);
                                setFormConfig({ ...formConfig, validationFields: updatedFields });
                              }}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No validation fields configured</p>
                      <p className="text-xs mt-1">Add fields that validate at specific workflow stages</p>
                    </CardContent>
                  </Card>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    const newField: FormField = {
                      id: `field_${Date.now()}`,
                      fieldType: "text",
                      label: "New Validation Field",
                      required: false,
                      requiredAtStage: ["submitted"],
                    };
                    setFormConfig({
                      ...formConfig,
                      validationFields: [...(formConfig.validationFields || []), newField],
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Validation Field
                </Button>

                {/* Version Notes */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="pt-6 space-y-3">
                    <Label className="text-sm font-medium">Version Notes (Optional)</Label>
                    <Textarea
                      value={changeNotes}
                      onChange={(e) => setChangeNotes(e.target.value)}
                      placeholder="Describe what changed in this version..."
                      rows={2}
                      className="resize-none"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <div className={showPreview ? "grid grid-cols-2 gap-6" : "space-y-4"}>
                <div className="space-y-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleCategoryDragEnd}
                  >
                    <SortableContext
                      items={formConfig.requiredDocuments?.categories.map((c) => c.id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      {formConfig.requiredDocuments?.categories.map((category, index) => (
                        <SortableCategory
                          key={category.id}
                          category={category}
                          categoryIndex={index}
                          removeCategory={removeCategory}
                          updateCategory={updateCategory}
                          addDocument={addDocument}
                          removeDocument={removeDocument}
                          updateDocument={updateDocument}
                          handleDocumentDragEnd={handleDocumentDragEnd}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  <Button onClick={addCategory} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document Category
                  </Button>

                  {/* Version Notes */}
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="pt-6 space-y-3">
                      <Label className="text-sm font-medium">Version Notes (Optional)</Label>
                      <Textarea
                        value={changeNotes}
                        onChange={(e) => setChangeNotes(e.target.value)}
                        placeholder="Describe what changed in this version..."
                        rows={2}
                        className="resize-none"
                      />
                    </CardContent>
                  </Card>
                </div>

                {showPreview && (
                  <div className="space-y-4 sticky top-6 h-fit">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Preview
                          </div>
                          <Select value={currentStage} onValueChange={setCurrentStage}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map((stage) => (
                                <SelectItem key={stage} value={stage} className="capitalize text-xs">
                                  {stage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FormPreview formConfig={formConfig} currentStage={currentStage} />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          </>
        )}

        {selectedProductId && editMode === "manual" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Manual JSON Editor</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Edit configuration directly as JSON</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditMode(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Mode Selection
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-1 min-h-[600px]">
                <Textarea
                  value={JSON.stringify(formConfig, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormConfig(parsed);
                    } catch (err) {
                      // Invalid JSON, don't update
                    }
                  }}
                  className="font-mono text-xs h-full resize-none"
                  placeholder="Edit your JSON configuration here..."
                />
              </div>
              
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-4 space-y-3">
                  <Label className="text-sm font-medium">Version Notes (Optional)</Label>
                  <Textarea
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    placeholder="Describe what changed in this version..."
                    rows={2}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

      </div>
      
      {/* Template Library Dialog */}
      <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              Configuration Template Library
            </DialogTitle>
            <DialogDescription>
              Select a pre-configured template to load into your service
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3 p-1">
              {/* Home Finance Template Card */}
              <Card 
                className="cursor-pointer hover:border-primary transition-all hover:shadow-md" 
                onClick={() => {
                  const homeFinanceTemplate = {
                    "validationFields": [
                      {
                        "id": "estimated_completion_time",
                        "label": "Estimated Completion Time",
                        "fieldType": "datetime-local",
                        "required": false,
                        "requiredAtStage": ["submitted"],
                        "helperText": "Must be set before submission",
                        "renderInForm": false
                      }
                    ],
                    "sections": [
                      {
                        "id": "section_1763351780363",
                        "sectionTitle": "ApplicantProfile",
                        "fields": [
                          {
                            "id": "field_1763353138103",
                            "fieldType": "select",
                            "label": "UAE Residency Status",
                            "placeholder": "",
                            "required": true,
                            "requiredAtStage": ["draft", "submitted", "returned", "rejected"],
                            "options": ["Resident", "Non-Resident"],
                            "helperText": ""
                          }
                        ]
                      },
                      {
                        "id": "section_1763353279464",
                        "sectionTitle": "Employment & Income Details",
                        "fields": [
                          {
                            "id": "field_1763353294701",
                            "fieldType": "select",
                            "label": "Employment Type",
                            "placeholder": "",
                            "required": true,
                            "requiredAtStage": ["draft", "submitted", "returned", "rejected"],
                            "options": ["Salaried", "Self-Employed"],
                            "helperText": ""
                          }
                        ]
                      },
                      {
                        "id": "section_1763354691864",
                        "sectionTitle": "Property Details",
                        "fields": [
                          {
                            "id": "field_1763354697699",
                            "fieldType": "number",
                            "label": "Property Value",
                            "placeholder": "",
                            "required": true,
                            "requiredAtStage": ["draft", "submitted", "returned", "rejected"],
                            "min": 0,
                            "helperText": ""
                          },
                          {
                            "id": "field_1763354739861",
                            "fieldType": "select",
                            "label": "Property Location",
                            "placeholder": "",
                            "required": true,
                            "requiredAtStage": ["draft", "submitted", "returned", "rejected", "completed"],
                            "options": ["Dubai", "AbuDhabi"],
                            "helperText": ""
                          }
                        ]
                      },
                      {
                        "id": "section_1763385614936",
                        "sectionTitle": "PaymentInformation",
                        "fields": [
                          {
                            "id": "field_1763385627846",
                            "fieldType": "number",
                            "label": "Amount",
                            "placeholder": "",
                            "required": true,
                            "requiredAtStage": ["draft", "submitted", "returned", "rejected", "completed", "paid"],
                            "helperText": ""
                          }
                        ]
                      },
                      {
                        "id": "section_1763385665676",
                        "sectionTitle": "AdditionalInformation",
                        "fields": [
                          {
                            "id": "field_1763385668922",
                            "fieldType": "textarea",
                            "label": "Notes",
                            "placeholder": "",
                            "required": false,
                            "requiredAtStage": ["draft", "submitted", "returned", "rejected", "completed", "paid"],
                            "helperText": ""
                          }
                        ]
                      }
                    ]
                  };
                  
                  setFormConfig(homeFinanceTemplate);
                  toast({
                    title: "Template Loaded",
                    description: "Home Finance template loaded successfully. Click Save to apply.",
                  });
                  setShowTemplateLibrary(false);
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Home Finance
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Complete configuration for home finance applications including applicant profile, employment details, property information, and payment details with conditional field logic.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <div className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                      5 Sections
                    </div>
                    <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      Conditional Fields
                    </div>
                    <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      Stage Validation
                    </div>
                    <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      ECT Included
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Placeholder for future templates */}
              <Alert className="bg-muted/50">
                <FileText className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  More templates coming soon! You can also save your own configurations as templates using the "Save as Template" button.
                </AlertDescription>
              </Alert>
            </div>
          </ScrollArea>
          
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowTemplateLibrary(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Save className="h-4 w-4 text-primary" />
              </div>
              Save as Template
            </DialogTitle>
            <DialogDescription>
              Save this configuration as a reusable template for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-sm font-medium">Template Name *</Label>
              <Input
                id="template-name"
                placeholder="e.g., Company Formation - Basic v1.0"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Use descriptive names with version numbers</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="template-description"
                placeholder="Describe when to use this template..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate} className="gap-2">
              <Save className="h-4 w-4" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import JSON Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="h-4 w-4 text-primary" />
              </div>
              Import Configuration
            </DialogTitle>
            <DialogDescription>
              Upload a JSON file to import form configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="json-import" className="text-sm font-medium">Select JSON File</Label>
              <Input
                id="json-import"
                type="file"
                accept=".json,application/json"
                onChange={handleImportJSON}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">Upload a previously exported configuration file</p>
            </div>

            {importErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription className="text-xs space-y-1">
                  {importErrors.map((error, i) => (
                    <div key={i}>• {error}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {importWarnings.length > 0 && (
              <Alert className="border-yellow-500/30 bg-yellow-500/5">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription className="text-xs space-y-1">
                  {importWarnings.map((warning, i) => (
                    <div key={i}>• {warning}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImportDialog(false);
              setImportErrors([]);
              setImportWarnings([]);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={showLoadTemplateDialog} onOpenChange={setShowLoadTemplateDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="h-4 w-4 text-primary" />
              </div>
              Load Template
            </DialogTitle>
            <DialogDescription>
              Choose a saved template to load into your configuration
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileJson className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No templates available yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Save your first template to get started</p>
                </div>
              ) : (
                templates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200"
                    onClick={() => handleLoadTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileJson className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base mb-1">{template.name}</h4>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>by {template.created_by?.name || 'Unknown'}</span>
                          </div>
                        </div>
                        <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadTemplateDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      {/* Validation Fields Preview Dialog */}
      <Dialog open={showValidationPreview} onOpenChange={setShowValidationPreview}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              Validation Fields Migration Preview
            </DialogTitle>
            <DialogDescription>
              This JSON structure will be applied to all services. Existing validation fields will be updated/replaced.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-4">
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">For All Services (10 services)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background rounded-lg p-4 overflow-x-auto border">
{`{
  "validationFields": [
    {
      "id": "estimated_completion_time",
      "fieldType": "date",
      "label": "Expected Date",
      "required": false,
      "requiredAtStage": ["submitted"],
      "renderInForm": false,
      "helperText": "Must be set before submission"
    }
  ]
}`}
                  </pre>
                </CardContent>
              </Card>

              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Business Bank Account Only (Additional Field)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background rounded-lg p-4 overflow-x-auto border">
{`{
  "validationFields": [
    {
      "id": "estimated_completion_time",
      "fieldType": "date",
      "label": "Expected Date",
      "required": false,
      "requiredAtStage": ["submitted"],
      "renderInForm": false,
      "helperText": "Must be set before submission"
    },
    {
      "id": "risk_level",
      "fieldType": "select",
      "label": "Risk Level",
      "options": ["Low", "Medium", "High"],
      "required": false,
      "requiredAtStage": ["submitted"],
      "renderInForm": false,
      "helperText": "Set via Risk Assessment on Application Detail page"
    }
  ]
}`}
                  </pre>
                </CardContent>
              </Card>

              <Alert className="border-amber-500/30 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle>What This Does</AlertTitle>
                <AlertDescription className="text-xs space-y-2 mt-2">
                  <p>✓ Updates <strong>estimated_completion_time</strong> field configuration for all services</p>
                  <p>✓ Ensures correct label ("Expected Date") and fieldType ("date")</p>
                  <p>✓ Adds/updates <strong>risk_level</strong> field only for Business Bank Account</p>
                  <p>✓ Preserves any other existing validation fields</p>
                  <p>✓ Replaces old/incorrect configurations with correct ones</p>
                </AlertDescription>
              </Alert>
            </div>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowValidationPreview(false)}>
              Close Preview
            </Button>
            <Button 
              onClick={() => {
                setShowValidationPreview(false);
                handleBatchAddValidationFields();
              }}
              disabled={batchUpdating}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {batchUpdating ? "Migrating..." : "Apply Migration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistoryDialog} onOpenChange={setShowVersionHistoryDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileJson className="h-4 w-4 text-primary" />
              </div>
              Version History
            </DialogTitle>
            <DialogDescription>
              View and restore previous versions of this configuration
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[600px] pr-4">
            <div className="space-y-3">
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileJson className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No version history yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Versions are created automatically when you save</p>
                </div>
              ) : (
                versions.map((version, index) => (
                  <Card key={version.id} className={version.version_number === versions[0].version_number ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${
                          version.version_number === versions[0].version_number 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          v{version.version_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">Version {version.version_number}</span>
                            {version.version_number === versions[0].version_number && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          {version.change_notes ? (
                            <p className="text-sm mb-2 bg-muted/50 rounded p-2 border">
                              {version.change_notes}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic mb-2">
                              No version notes provided
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{new Date(version.created_at).toLocaleString()}</span>
                            <span>•</span>
                            <span>by {version.changed_by?.name || 'Unknown'}</span>
                          </div>
                        </div>
                        {version.version_number !== versions[0].version_number && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreVersion(version)}
                            className="gap-2 shrink-0"
                          >
                            <Upload className="h-4 w-4" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <p className="text-xs text-muted-foreground flex-1">
              {versions.length} version{versions.length !== 1 ? 's' : ''} total
            </p>
            <Button variant="outline" onClick={() => setShowVersionHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Buttons */}
      {selectedProductId && !loading && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
          {/* Preview Toggle FAB */}
          <Button
            size="lg"
            variant={showPreview ? "default" : "outline"}
            onClick={() => setShowPreview(!showPreview)}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 p-0"
            title={showPreview ? "Hide Preview" : "Show Preview"}
          >
            {showPreview ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </Button>

          {/* Save Configuration FAB */}
          <Button
            size="lg"
            onClick={saveConfiguration}
            disabled={saving}
            className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90 p-0"
            title="Save Configuration"
          >
            <Save className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* JSON Snippet Injector Dialog */}
      <Dialog open={showSnippetDialog} onOpenChange={setShowSnippetDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Code className="h-4 w-4 text-blue-600" />
              </div>
              JSON Snippet Injector
            </DialogTitle>
            <DialogDescription>
              Paste a JSON snippet to add a section, field, or document category to service configurations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-y-auto py-4">
            {/* Snippet Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Snippet Type</Label>
              <Select value={snippetType} onValueChange={(v: any) => setSnippetType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="section">Section (with fields)</SelectItem>
                  <SelectItem value="field">Single Field (in section)</SelectItem>
                  <SelectItem value="validation_field">Validation Field (standalone)</SelectItem>
                  <SelectItem value="document_category">Document Category</SelectItem>
                </SelectContent>
              </Select>
              {snippetType === "validation_field" && (
                <p className="text-xs text-muted-foreground">
                  Validation fields are stored outside sections — ideal for fields like <code className="bg-muted px-1 rounded text-[10px]">estimated_completion_time</code>, <code className="bg-muted px-1 rounded text-[10px]">risk_level</code> that don't render in forms but are validated at specific stages.
                </p>
              )}
            </div>

            {/* Target Section (only for field type) */}
            {snippetType === "field" && applyTo === "current" && selectedProductId && formConfig?.sections && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Section</Label>
                <Select value={targetSectionId} onValueChange={setTargetSectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a section to add field to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {formConfig.sections.map((section: any) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.sectionTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select which section to add the field to
                </p>
              </div>
            )}

            {snippetType === "field" && applyTo === "all" && (
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-700">
                  When applying to all services, the field will be added to the <strong>first section</strong> of each service configuration.
                </AlertDescription>
              </Alert>
            )}

            {/* Apply To */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Apply To</Label>
              <RadioGroup value={applyTo} onValueChange={(v: any) => setApplyTo(v)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="current" id="apply-current" />
                  <Label htmlFor="apply-current" className="text-sm font-normal cursor-pointer">
                    Current Service Only {selectedProductId ? "" : "(select a product first)"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="apply-all" />
                  <Label htmlFor="apply-all" className="text-sm font-normal cursor-pointer">
                    All Services
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* JSON Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">JSON Snippet</Label>
              <Textarea
                value={snippetJSON}
                onChange={(e) => {
                  setSnippetJSON(e.target.value);
                  setSnippetError(null);
                }}
                placeholder={snippetType === "section" ? `{
  "id": "section_validation_requirements",
  "sectionTitle": "Submission Requirements",
  "fields": [
    {
      "id": "field_estimated_completion",
      "fieldType": "date",
      "label": "Estimated Completion Date",
      "required": true,
      "requiredAtStage": ["submitted"],
      "renderInForm": false,
      "helperText": "Required before submission"
    }
  ]
}` : snippetType === "field" ? `{
  "id": "field_new_field",
  "fieldType": "text",
  "label": "New Field",
  "required": true,
  "requiredAtStage": ["draft", "submitted"],
  "renderInForm": true
}` : snippetType === "validation_field" ? `{
  "id": "estimated_completion_time",
  "fieldType": "datetime-local",
  "label": "Estimated Completion Time",
  "required": false,
  "requiredAtStage": ["submitted"],
  "renderInForm": false,
  "helperText": "Must be set before submission"
}` : `{
  "id": "category_new",
  "name": "New Category",
  "documents": [
    {
      "id": "doc_1",
      "name": "Document Name",
      "isMandatory": true,
      "acceptedFileTypes": ["pdf", "jpg", "png"]
    }
  ]
}`}
                className="font-mono text-xs min-h-[200px]"
              />
              {snippetError && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{snippetError}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Tips */}
            <Alert className="bg-muted/50">
              <AlertTitle className="text-xs font-medium">Tips</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>If the snippet ID already exists, it will be <strong>replaced</strong></li>
                  <li>Use <code className="bg-muted px-1 rounded">renderInForm: false</code> for validation-only fields</li>
                  <li>Use <code className="bg-muted px-1 rounded">requiredAtStage</code> to specify when fields are required</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowSnippetDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplySnippet} 
              disabled={snippetApplying || !snippetJSON.trim()}
              className="gap-2"
            >
              {snippetApplying ? "Applying..." : applyTo === "all" ? "Apply to All Services" : "Apply to Current"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ServiceFormConfiguration;
