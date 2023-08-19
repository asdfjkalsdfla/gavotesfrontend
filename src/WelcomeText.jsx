import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloseOutlined } from "@ant-design/icons";

export default function WelcomeText({ updateShowWelcome }) {
  return (
    <React.Fragment>
      <h1>
        Welcome!
        <span style={{ float: "right" }}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              localStorage.setItem("welcomeShown", true);
              updateShowWelcome(false);
            }}
          >
            <X />
          </Button>
        </span>
      </h1>
      <br />
      <h2>What you see</h2>
      <div>
        The height of each county is the % of voters that have early voted this year vs. in 2020 at the same, and the color is the split between Biden and Trump
        in 2020.
      </div>
      <br />
      <h2>How to get around</h2>
      <div>
        <b>See Precinct Level Details for A Single County</b> <br />
        click on a county, then click the &apos;See Precinct Level&apos; results button
        <br />
        <br />
        <b>See Results for All Precincts</b> <br />
        zoom in on the map using the &quot;+&quot; key on your keyboard. Once you&apos;re close enough, you&apos;ll see precinct level results
        <br />
        <br />
        <b>It&apos;s tough to see the height. Can I see it better?</b> <br />
        Press the shift key and then move your mouse up and down or left and right. That will move you around in the space
        <br />
        <br />
        <b>What if the height should be something else?</b> <br />
        Click the configuration gear on the top right and choose a different option for the height!
        <br />
        <br />
      </div>
    </React.Fragment>
  );
}
