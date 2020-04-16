import React from "react"

import { Button, Menu, MenuItem, Icon } from "@material-ui/core";

export const DropDownMenu = (props) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClick = (event, key) => {
    setAnchorEl(null);
    props.onChange(key);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        aria-controls="sort-by"
        aria-haspopup="true"
        onClick={handleOpen}
        endIcon={<Icon>expand_more</Icon>}
        size="small"
        style={{textTransform: 'none'}}
      >
        {props.keys[props.selectedKey]}
      </Button>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {Object.entries(props.keys).map(([key, text]) =>
          <MenuItem
            key={key}
            selected={key === props.selectedKey}
            onClick={event => handleClick(event, key)}>
              {text}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
