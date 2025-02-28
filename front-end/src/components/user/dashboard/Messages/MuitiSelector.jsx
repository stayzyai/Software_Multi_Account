import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import { useState, useEffect } from "react";

const MultipleSelectCheckmarks = ({ listings, onChange, value }) => {
  const [selectedIds, setSelectedIds] = useState(value || []);

  useEffect(() => {
    if (value) {
      setSelectedIds(value);
    }
  }, [value]);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    const newValue = typeof value === "string" ? value.split(",") : value;
    setSelectedIds(newValue);
    onChange(newValue);
  };

  const getSelectedNames = () => {
    if (selectedIds.length === 0) {
      return <span style={{ color: "black" }}>Listings</span>;
    }

    return listings
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => item.name)
      .join(", ");
  };

  return (
    <div>
      <FormControl sx={{ width: 222 }}>
        <Select
          id="demo-multiple-checkbox"
          multiple
          displayEmpty
          value={selectedIds}
          onChange={handleChange}
          input={<OutlinedInput sx={{ height: 100, width: 100 }} />}
          sx={{ height: 36 }}
          renderValue={getSelectedNames}
        >
          {listings?.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              <Checkbox checked={selectedIds.includes(item.id)} />
              <ListItemText primary={item.name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default MultipleSelectCheckmarks;
