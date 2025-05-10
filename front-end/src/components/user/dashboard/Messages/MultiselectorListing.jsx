import React, { useState, useEffect } from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";

const MultipleSelectListing = ({
  listings,
  setSelectedListingIds,
  selectedListingIds,
}) => {
  const [selectedTask, setSelectedTask] = useState([]);

  useEffect(() => {
    const matchedIds = listings
      .filter((item) => selectedListingIds.includes(item.id))
      .map((item) => item.id);
    setSelectedTask(matchedIds);
  }, [selectedListingIds]);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;

    if (value.includes("clear")) {
      return;
    }

    const newSelectedListingIds =
      typeof value === "string" ? value.split(",") : value;

    setSelectedTask(newSelectedListingIds);

    const listingId = listings
      ?.filter((item) => newSelectedListingIds.includes(item.id))
      .map((item) => item.id)
      .filter((id) => id !== undefined);

    setSelectedListingIds(listingId);
  };

  const getSelectedNames = () => {
    if (!selectedTask.length) return "Listings";
    return listings
      .filter((item) => selectedTask.includes(item.id))
      .map((item) => item.name)
      .join(", ");
  };

  const handleClearInDropdown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedTask([]);
    setSelectedListingIds([]);
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <FormControl sx={{ minWidth: 120 }}>
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
                maxWidth: 200,
                marginRight: 100,
                overflow: "auto",
              },
              sx: {
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
              },
            },
          }}
          sx={{
            fontSize: "14px",
            fontFamily: "DM Sans",
            fontWeight: 500,
            width: "110px",
            border: "none",
          }}
        >
          <MenuItem
            value="clear"
            onClick={handleClearInDropdown}
            sx={{ py: 0.4, fontSize: "1px", color: "red", width: "200px", textAlign:"center"}}
          >
            <ListItemText
              primary="Clear Filter"
              primaryTypographyProps={{
                fontSize: "11px",
                fontWeight: 500,
              }}
            />
          </MenuItem>

          {listings?.map((item) => (
            <MenuItem key={item.id} value={item.id} sx={{ py: 0.4 }}>
              <Checkbox
                checked={selectedTask.includes(item.id)}
                sx={{
                  p: 0.5,
                  mr: 0,
                  transform: "scale(0.8)",
                }}
              />
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default MultipleSelectListing;
