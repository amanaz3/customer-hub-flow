import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  options?: string[];
  helperText?: string;
}

interface FormSection {
  id: string;
  sectionTitle: string;
  fields: FormField[];
}

interface FormConfig {
  sections: FormSection[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
}

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
      className="border rounded-lg p-4 space-y-3 bg-muted/30"
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium">Field {fieldIndex + 1}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeField(sectionId, field.id)}
          className="ml-auto"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Field Type</Label>
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
          <Label>Field Label</Label>
          <Input
            value={field.label}
            onChange={(e) =>
              updateField(sectionId, field.id, { label: e.target.value })
            }
            placeholder="e.g., Business Name"
          />
        </div>

        <div>
          <Label>Placeholder</Label>
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

        <div className="flex items-center gap-2 pt-6">
          <Switch
            checked={field.required}
            onCheckedChange={(checked) =>
              updateField(sectionId, field.id, { required: checked })
            }
          />
          <Label>Required Field</Label>
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
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            value={section.sectionTitle}
            onChange={(e) => updateSection(section.id, e.target.value, section.fields)}
            className="flex-1 font-semibold"
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
      <CardContent className="space-y-4">
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
const FormPreview = ({ formConfig }: { formConfig: FormConfig }) => {
  return (
    <div className="space-y-6">
      {formConfig.sections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No sections configured yet. Add sections to see the preview.</p>
        </div>
      ) : (
        formConfig.sections.map((section) => (
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
                  <Label>
                    {field.label}
                    {field.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  
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
        ))
      )}
    </div>
  );
};

const ServiceFormConfiguration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [formConfig, setFormConfig] = useState<FormConfig>({ sections: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
      setFormConfig(data.form_config as unknown as FormConfig);
    } else {
      setFormConfig({ sections: [] });
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
      sections: [...prev.sections, newSection],
    }));
  };

  const removeSection = (sectionId: string) => {
    setFormConfig((prev) => ({
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
  };

  const updateSection = (sectionId: string, title: string, fields?: FormField[]) => {
    setFormConfig((prev) => ({
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
          sections: arrayMove(prev.sections, oldIndex, newIndex),
        };
      });
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
    }
    setSaving(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/customer-services")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Form Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Configure dynamic forms for each service/product. Drag to reorder sections and fields.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            disabled={!selectedProductId}
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
          <Button onClick={saveConfiguration} disabled={saving || !selectedProductId}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Product/Service</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger>
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
        </CardContent>
      </Card>

      {selectedProductId && !loading && (
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
          </div>

          {showPreview && (
            <div className="space-y-4 sticky top-6 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Form Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormPreview formConfig={formConfig} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceFormConfiguration;
