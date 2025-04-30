
import { useState } from "react";
import { FormField } from "../../utils/dummyData";
import { FormFieldPreview, FieldEditor } from "./FieldTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { PlusCircle } from "lucide-react";

interface FormBuilderProps {
  fields: FormField[];
  onFieldsUpdate: (fields: FormField[]) => void;
}

export const FormBuilder = ({ fields, onFieldsUpdate }: FormBuilderProps) => {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onFieldsUpdate(items);
  };

  const handleAddField = () => {
    const newField: FormField = {
      id: `field${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
    };
    
    setIsAddingField(true);
    setEditingFieldId(newField.id);
    onFieldsUpdate([...fields, newField]);
  };

  const handleDeleteField = (id: string) => {
    onFieldsUpdate(fields.filter((field) => field.id !== id));
    
    if (editingFieldId === id) {
      setEditingFieldId(null);
    }
  };

  const handleEditField = (id: string) => {
    setEditingFieldId(id);
    setIsAddingField(false);
  };

  const handleSaveField = (updatedField: FormField) => {
    onFieldsUpdate(
      fields.map((field) => 
        field.id === updatedField.id ? updatedField : field
      )
    );
    setEditingFieldId(null);
    setIsAddingField(false);
  };

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="form-fields">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {editingFieldId === field.id ? (
                        <FieldEditor
                          field={field}
                          onSave={handleSaveField}
                          onCancel={() => {
                            setEditingFieldId(null);
                            if (isAddingField) {
                              // Remove the field if it was just added but not saved
                              onFieldsUpdate(fields.filter(f => f.id !== field.id));
                              setIsAddingField(false);
                            }
                          }}
                        />
                      ) : (
                        <FormFieldPreview
                          field={field}
                          onEdit={() => handleEditField(field.id)}
                          onDelete={() => handleDeleteField(field.id)}
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {fields.length === 0 && !isAddingField && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-muted-foreground mb-4">No fields added yet</p>
            <Button onClick={handleAddField} className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Field
            </Button>
          </CardContent>
        </Card>
      )}

      {fields.length > 0 && !editingFieldId && (
        <div className="flex justify-center mt-4">
          <Button onClick={handleAddField} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
