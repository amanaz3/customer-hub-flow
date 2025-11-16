import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Eye, EyeOff, Upload, Download, FileJson, AlertTriangle, Code } from "lucide-react";
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
import { validateFormConfigJSON, exportFormConfigToJSON, generateSampleFormConfig } from "@/utils/formConfigValidation";
import { JsonEditorDialog } from "@/components/Configure/JsonEditorDialog";
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
  options?: string[];
  helperText?: string;
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
            {['draft', 'submitted', 'review', 'approval', 'completed'].map((stage) => (
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
              {section.fields.map((field) => (
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
                    <Select disabled>
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
                    <RadioGroup disabled>
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
    requiredDocuments: { categories: [] }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"fields" | "documents">("fields");
  const [currentStage, setCurrentStage] = useState<string>("draft");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  
  // Template management state
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showLoadTemplateDialog, setShowLoadTemplateDialog] = useState(false);
  const [showVersionHistoryDialog, setShowVersionHistoryDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [changeNotes, setChangeNotes] = useState("");

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
        requiredDocuments: config.requiredDocuments || { categories: [] }
      });
    } else {
      setFormConfig({ 
        sections: [],
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
      } as any);

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
                <h1 className="text-xl font-bold tracking-tight">Service Form Configuration</h1>
                <p className="text-xs text-muted-foreground">
                  Configure forms, drag to reorder
                </p>
              </div>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJsonEditor(true)}
                  disabled={!selectedProductId}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Code className="h-3 w-3" />
                  Editor
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
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a product to configure" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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

        {selectedProductId && (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "fields" | "documents")} className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2 h-11">
                <TabsTrigger value="fields" className="gap-2">
                  <GripVertical className="h-4 w-4" />
                  Form Fields
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
      </div>
      
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

      {/* JSON Editor Dialog */}
      <JsonEditorDialog
        open={showJsonEditor}
        onOpenChange={setShowJsonEditor}
        currentConfig={formConfig}
        onSave={(newConfig) => setFormConfig(newConfig)}
      />
    </div>
  );
};

export default ServiceFormConfiguration;
