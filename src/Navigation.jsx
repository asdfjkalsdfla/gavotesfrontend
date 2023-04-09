import React, { useState } from "react";
import { SettingOutlined, MenuOutlined, TableOutlined, DotChartOutlined, GlobalOutlined } from "@ant-design/icons";
import "./Navigation.css";

export default function Navigation({ updateDisplayType, updateShowOptions, showOptions }) {
  const useExpandContract = window.innerWidth < 900;
  const [showMenu, updateShowMenu] = useState(!useExpandContract);

  const toggleMenuShown = () => {
    updateShowMenu(!showMenu);
  };

  return (
    <>
      {useExpandContract && <MenuOutlined onClick={toggleMenuShown} />}
      {showMenu && <NavMenu updateDisplayType={updateDisplayType} updateShowOptions={updateShowOptions} showOptions={showOptions} />}
    </>
  );
}

function NavMenu({ updateDisplayType, updateShowOptions, showOptions }) {
  return (
    <div className="navigationMenu">
      <ul>
        <li onClick={() => updateDisplayType("map")}>
          <span className="iconSpace">
            <GlobalOutlined />
          </span>{" "}
          Map
        </li>
        <li onClick={() => updateDisplayType("scatter")}>
          <span className="iconSpace">
            <DotChartOutlined />
          </span>
          Scatter Plot
        </li>
        <li onClick={() => updateDisplayType("table")}>
          <span className="iconSpace">
            <TableOutlined />
          </span>
          Table
        </li>
        <li
          onClick={() => {
            updateShowOptions(!showOptions);
          }}
        >
          <span className="iconSpace">
            <SettingOutlined size="large" />
          </span>
          Settings
        </li>
      </ul>
    </div>
  );
}
