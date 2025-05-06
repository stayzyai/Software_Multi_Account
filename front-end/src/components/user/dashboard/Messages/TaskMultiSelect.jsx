import { useState } from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

const TaskMultiSelect = ({ tasks, setSelectedIds }) => {
  const [selectedTask, setSelectedTask] = useState([]);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    const newSelectedTaskIds =
      typeof value === "string" ? value.split(",") : value;

    setSelectedTask(newSelectedTaskIds);

    const reservationIds = tasks
      ?.filter((item) => newSelectedTaskIds.includes(item.id))
      .map((item) => item.reservationId)
      .filter((id) => id !== undefined);

    setSelectedIds(reservationIds);
  };

  const getSelectedNames = () => {
    if (!selectedTask.length) return "Tasks";
    return tasks
      .filter((item) => selectedTask.includes(item.id))
      .map((item) => item.title)
      .join(", ");
  };

  const handleClearFilter = () => {
    setSelectedTask([]);
    setSelectedIds([]);
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <FormControl sx={{ minWidth: 10 }}>
        <Select
          multiple
          displayEmpty
          value={selectedTask}
          onChange={handleChange}
          input={<OutlinedInput />}
          renderValue={getSelectedNames}
          size="small"
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300,
                maxWidth: 220,
                marginRight: 100,
              },
            },
          }}
          sx={{
            fontSize: "14px",
            fontFamily: "DM Sans",
            fontWeight: 500,
            width: 100,
            border: "none",
          }}
        >
          {tasks?.map((item) => (
            <MenuItem key={item.id} value={item.id} sx={{ py: 0.4 }}>
              <Checkbox
                checked={selectedTask.includes(item.id)}
                sx={{ p: 0.5, mr: 0 }}
              />
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedTask.length > 0 && (
        <Button
          onClick={handleClearFilter}
          variant="text"
          color="error"
          sx={{ fontSize: "12px", textTransform: "none" }}
        >
          Clear
        </Button>
      )}
    </Box>
  );
};

export default TaskMultiSelect;
