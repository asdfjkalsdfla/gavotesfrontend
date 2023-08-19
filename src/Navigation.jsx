import React, { useState } from "react";
// import { SettingOutlined, MenuOutlined, TableOutlined, DotChartOutlined, GlobalOutlined } from "@ant-design/icons";
import {
  SlidersHorizontal as SettingOutlined,
  Menu as MenuOutlined,
  Table as TableOutlined,
  ScatterChart as DotChartOutlined,
  Globe as GlobalOutlined,
} from "lucide-react";
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
      <ul className="text-xs font-sans">
        <li onClick={() => updateDisplayType("map")}>
          <GlobalOutlined className="mr-2 md:mr-1 md:ml-2 h-4 w-4" />
          Map
        </li>
        <li onClick={() => updateDisplayType("scatter")}>
          <DotChartOutlined className="mr-2 md:mr-1 md:ml-2 h-4 w-4" />
          Scatter Plot
        </li>
        <li onClick={() => updateDisplayType("table")}>
          <TableOutlined className="mr-2 md:mr-1 md:ml-2 h-4 w-4" />
          Table
        </li>
        <li
          onClick={() => {
            updateShowOptions(!showOptions);
          }}
        >
          <SettingOutlined className="mr-2 md:mr-1 md:ml-2 h-4 w-4" />
          Settings
        </li>
      </ul>
    </div>
  );
}
