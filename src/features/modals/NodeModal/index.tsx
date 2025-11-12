import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Button, Textarea,} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";

// Helper — remove array/object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj: Record<string, unknown> = {};
  nodeRows.forEach((row) => {
    if (row.type !== "array" && row.type !== "object" && row.key) {
      obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// Helper — return JSON path as $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map((seg) =>
    typeof seg === "number" ? seg : `"${seg}"`
  );
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph((state) => state.selectedNode);
  const updateValueAtPath = useJson((state) => state.updateValueAtPath);

  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");

  // Reset when opened or node changes
  React.useEffect(() => {
    setIsEditing(false);
    setEditValue("");
  }, [opened, nodeData]);

  const handleEdit = () => {
    const currentValue = normalizeNodeData(nodeData?.text ?? []);
    setEditValue(currentValue);
    setIsEditing(true);
  };

  const handleSave = () => {
    try {
      const parsedValue = JSON.parse(editValue);

      if (nodeData?.path) {
        // Single value
        if (nodeData.text.length === 1 && !nodeData.text[0].key) {
          updateValueAtPath(nodeData.path, parsedValue);
        } else {
          // Object with fields
          Object.entries(parsedValue).forEach(([key, value]) => {
            const fullPath = [...nodeData.path!, key];
            updateValueAtPath(fullPath, value);
          });
        }
      }

      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Invalid JSON:", error);
      alert("Invalid JSON format. Please fix your input before saving.");
    }
  };

  const handleCancel = () => {
    setEditValue("");
    setIsEditing(false);
  };

  return (
    <Modal
      size="auto"
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton={false}
    >
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Flex gap="xs" align="center">
              {!isEditing && (
                <Button size="xs" variant="default" onClick={handleEdit}>
                  Edit
                </Button>
              )}
              <CloseButton onClick={onClose} />
            </Flex>
          </Flex>

          {isEditing ? (
            <>
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                minRows={8}
                maxRows={15}
                styles={{
                  input: {
                    fontFamily: "monospace",
                    fontSize: "12px",
                  },
                }}
                autosize
              />
              <Flex gap="xs" justify="flex-end">
                <Button size="xs" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" color="red" onClick={handleCancel}>
                  Cancel
                </Button>
              </Flex>
            </>
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={normalizeNodeData(nodeData?.text ?? [])}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          )}
        </Stack>

        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied!"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
