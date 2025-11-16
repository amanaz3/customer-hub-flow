import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

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

const ServiceFormConfiguration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [formConfig, setFormConfig] = useState<FormConfig>({ sections: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const updateSection = (sectionId: string, title: string) => {
    setFormConfig((prev) => ({
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, sectionTitle: title } : s
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
            Configure dynamic forms for each service/product
          </p>
        </div>
        <Button onClick={saveConfiguration} disabled={saving || !selectedProductId}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
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
        <div className="space-y-4">
          {formConfig.sections.map((section, sectionIndex) => (
            <Card key={section.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <Input
                    value={section.sectionTitle}
                    onChange={(e) => updateSection(section.id, e.target.value)}
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
                {section.fields.map((field, fieldIndex) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Field {fieldIndex + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(section.id, field.id)}
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
                            updateField(section.id, field.id, { fieldType: value })
                          }
                        >
                          <SelectTrigger>
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

                      <div>
                        <Label>Field Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            updateField(section.id, field.id, { label: e.target.value })
                          }
                          placeholder="e.g., Business Name"
                        />
                      </div>

                      <div>
                        <Label>Placeholder</Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            updateField(section.id, field.id, {
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
                            updateField(section.id, field.id, { required: checked })
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
                          updateField(section.id, field.id, {
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
                            updateField(section.id, field.id, {
                              options: e.target.value.split(",").map((s) => s.trim()),
                            })
                          }
                          placeholder="Option 1, Option 2, Option 3"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                ))}

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
          ))}

          <Button onClick={addSection} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      )}
    </div>
  );
};

export default ServiceFormConfiguration;
