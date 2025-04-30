
import { useState } from "react";
import { FormField } from "../../utils/dummyData";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

// For the form builder preview
export const FormFieldPreview = ({ field, onEdit, onDelete }: { field: FormField; onEdit: () => void; onDelete: () => void }) => {
  return (
    <Card className="form-field-container group">
      <CardHeader className="pb-2 relative flex flex-row items-center justify-between">
        <div>
          <h3 className="text-md font-medium">{field.label} {field.required && <span className="text-destructive">*</span>}</h3>
          {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
            <span className="sr-only">Edit field</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-destructive">
            <span className="sr-only">Delete field</span>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <RenderField field={field} disabled={true} value={undefined} onChange={() => {}} />
      </CardContent>
    </Card>
  );
};

// For rendering actual form fields in the published form
export const RenderField = ({ 
  field, 
  disabled = false, 
  value, 
  onChange 
}: { 
  field: FormField; 
  disabled?: boolean; 
  value: any; 
  onChange: (value: any) => void;
}) => {
  switch (field.type) {
    case "text":
      return (
        <Input
          id={field.id}
          placeholder={field.placeholder}
          disabled={disabled}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case "textarea":
      return (
        <Textarea
          id={field.id}
          placeholder={field.placeholder}
          disabled={disabled}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case "select":
      return (
        <Select
          disabled={disabled}
          value={value || ""}
          onValueChange={onChange}
          required={field.required}
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "checkbox":
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.id}
            disabled={disabled}
            checked={value || false}
            onCheckedChange={onChange}
            required={field.required}
          />
          <label htmlFor={field.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {field.label}
          </label>
        </div>
      );
    case "radio":
      return (
        <RadioGroup
          disabled={disabled}
          value={value || ""}
          onValueChange={onChange}
          required={field.required}
        >
          {field.options?.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${field.id}-${option}`} />
              <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    case "date":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "PPP") : <span>{field.placeholder || "Pick a date"}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto">
            <Calendar
              mode="single"
              selected={value}
              onSelect={onChange}
              disabled={disabled}
              initialFocus
              required={field.required}
            />
          </PopoverContent>
        </Popover>
      );
    case "email":
      return (
        <Input
          id={field.id}
          type="email"
          placeholder={field.placeholder}
          disabled={disabled}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case "number":
      return (
        <Input
          id={field.id}
          type="number"
          placeholder={field.placeholder}
          disabled={disabled}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    default:
      return <div>Unsupported field type</div>;
  }
};

// For editing form fields in the builder
export const FieldEditor = ({ 
  field, 
  onSave, 
  onCancel 
}: { 
  field: FormField; 
  onSave: (updatedField: FormField) => void; 
  onCancel: () => void;
}) => {
  const [editedField, setEditedField] = useState<FormField>({ ...field });
  const [newOption, setNewOption] = useState("");

  const handleAddOption = () => {
    if (newOption.trim() && !editedField.options?.includes(newOption.trim())) {
      setEditedField({
        ...editedField,
        options: [...(editedField.options || []), newOption.trim()],
      });
      setNewOption("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setEditedField({
      ...editedField,
      options: editedField.options?.filter((opt) => opt !== option),
    });
  };

  return (
    <Card className="form-field-container">
      <CardHeader>
        <h3 className="text-lg font-medium">Edit Field</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fieldType">Field Type</Label>
            <Select
              value={editedField.type}
              onValueChange={(value) => 
                setEditedField({
                  ...editedField,
                  type: value as FormField["type"],
                  options: ["select", "radio"].includes(value) ? editedField.options || [] : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="textarea">Textarea</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="radio">Radio Buttons</SelectItem>
                <SelectItem value="date">Date Picker</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fieldLabel">Field Label</Label>
            <Input
              id="fieldLabel"
              value={editedField.label}
              onChange={(e) => setEditedField({ ...editedField, label: e.target.value })}
              placeholder="Enter field label"
            />
          </div>

          {!["checkbox", "radio"].includes(editedField.type) && (
            <div className="space-y-2">
              <Label htmlFor="fieldPlaceholder">Placeholder</Label>
              <Input
                id="fieldPlaceholder"
                value={editedField.placeholder || ""}
                onChange={(e) => setEditedField({ ...editedField, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fieldDescription">Description (optional)</Label>
            <Textarea
              id="fieldDescription"
              value={editedField.description || ""}
              onChange={(e) => setEditedField({ ...editedField, description: e.target.value })}
              placeholder="Enter field description"
            />
          </div>

          {["select", "radio"].includes(editedField.type) && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex space-x-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add new option"
                />
                <Button type="button" onClick={handleAddOption} disabled={!newOption.trim()}>
                  Add
                </Button>
              </div>
              <div className="mt-2">
                {editedField.options?.map((option) => (
                  <div key={option} className="flex items-center justify-between py-1">
                    <span>{option}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(option)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(!editedField.options || editedField.options.length === 0) && (
                  <p className="text-sm text-muted-foreground">No options added yet</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="fieldRequired"
              checked={editedField.required}
              onCheckedChange={(checked) => setEditedField({ ...editedField, required: !!checked })}
            />
            <Label htmlFor="fieldRequired">Required field</Label>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={() => onSave(editedField)} 
          disabled={!editedField.label.trim() || (["select", "radio"].includes(editedField.type) && (!editedField.options || editedField.options.length < 1))}
        >
          Save Field
        </Button>
      </CardFooter>
    </Card>
  );
};
