import React, { useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
// import { SettingOutlined, MenuOutlined, TableOutlined, DotChartOutlined, GlobalOutlined } from "@ant-design/icons";
import {
  SlidersHorizontal as SettingOutlined,
  Menu as MenuOutlined,
  Table as TableOutlined,
  ScatterChart as DotChartOutlined,
  Globe as GlobalOutlined,
} from "lucide-react";
import "./Navigation.css";

export default function Navigation({ updateShowOptions, showOptions }) {
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
            <NavMenu updateShowOptions={updateShowOptions} showOptions={showOptions} />
          </div>
        )}
      </div>
      <div className="hidden md:flex md:flex-1 md:justify-end">
        <NavMenu updateShowOptions={updateShowOptions} showOptions={showOptions} />
      </div>
    </>
  );
}

function NavMenu({ updateShowOptions, showOptions }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current county from the path if it exists
  const getCurrentCounty = () => {
    const pathname = location.pathname;
    if (pathname.includes("/counties/")) {
      const pathParts = pathname.split("/");
      const countyIndex = pathParts.indexOf("counties");
      if (countyIndex !== -1 && pathParts[countyIndex + 1]) {
        return pathParts[countyIndex + 1];
      }
    }
    return null;
  };

  const navigateToDisplayMode = (urlPath) => {
    const currentCounty = getCurrentCounty();
    const basePath = currentCounty ? `/counties/${currentCounty}` : "";
    const newPath = `${basePath}/${urlPath}`;
    
    navigate({ to: newPath });
  };

  return (
    <div className="navigationMenu">
      <ul>
        <li>
          <button
            type="button"
            className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium cursor-pointer w-full text-left flex items-center"
            onClick={() => navigateToDisplayMode("maps")}
          >
            <GlobalOutlined className="mr-2 md:mr-1 h-4 w-4" />
            Map
          </button>
        </li>
        <li>
          <button
            type="button"
            className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium cursor-pointer w-full text-left flex items-center"
            onClick={() => navigateToDisplayMode("scatter")}
          >
            <DotChartOutlined className="mr-2 md:mr-1 h-4 w-4" />
            Scatter Plot
          </button>
        </li>
        <li>
          <button
            type="button"
            className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium cursor-pointer w-full text-left flex items-center"
            onClick={() => navigateToDisplayMode("table")}
          >
            <TableOutlined className="mr-2 md:mr-1 h-4 w-4" />
            Table
          </button>
        </li>
        <li>
          <button
            type="button"
            className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium cursor-pointer w-full text-left flex items-center"
            onClick={() => {
              updateShowOptions(!showOptions);
            }}
          >
            <SettingOutlined className="mr-2 md:mr-1 h-4 w-4" />
            Settings
          </button>
        </li>
      </ul>
    </div>
  );
}
