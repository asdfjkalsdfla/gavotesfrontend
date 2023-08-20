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
  const [showMenuOnMobile, updateShowMenu] = useState(false);

  const toggleMenuShown = () => {
    updateShowMenu(!showMenuOnMobile);
  };

  return (
    <>
      <div className="flex flex-1 justify-end md:hidden">
        <button type="button" className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5">
          <MenuOutlined onClick={toggleMenuShown} />
        </button>
      </div>
      <div className="md:hidden" role="dialog" aria-modal="true">
        {showMenuOnMobile && (
          <div className="p-2">
            <NavMenu updateDisplayType={updateDisplayType} updateShowOptions={updateShowOptions} showOptions={showOptions} />
          </div>
        )}
      </div>
      <div className="hidden md:flex md:flex-1 md:justify-end">
        <NavMenu updateDisplayType={updateDisplayType} updateShowOptions={updateShowOptions} showOptions={showOptions} />
      </div>
    </>
  );
}

function NavMenu({ updateDisplayType, updateShowOptions, showOptions }) {
  return (
    <div className="navigationMenu">
      <ul>
        <li className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium" onClick={() => updateDisplayType("map")}>
          <GlobalOutlined className="mr-2 md:mr-1 h-4 w-4" />
          Map
        </li>
        <li className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium" onClick={() => updateDisplayType("scatter")}>
          <DotChartOutlined className="mr-2 md:mr-1 h-4 w-4" />
          Scatter Plot
        </li>
        <li className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium" onClick={() => updateDisplayType("table")}>
          <TableOutlined className="mr-2 md:mr-1 h-4 w-4" />
          Table
        </li>
        <li
          className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
          onClick={() => {
            updateShowOptions(!showOptions);
          }}
        >
          <SettingOutlined className="mr-2 md:mr-1 h-4 w-4" />
          Settings
        </li>
      </ul>
    </div>
  );
}
