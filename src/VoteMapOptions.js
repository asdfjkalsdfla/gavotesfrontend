import React from "react";
import { Select, Button, Checkbox } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
const { Option } = Select;


export default function VoteMapOptions({ updateElevationApproach, updateShowOptions, elevationApproach, updateColorApproach, colorApproach, updateShow2016Data, show2016Data, updateShow2018Data, show2018Data }) {
    return <React.Fragment><h1>Options
        {updateShowOptions && <span style={{ float: "right" }}><Button shape="circle" icon={<CloseOutlined />} onClick={() => {
            updateShowOptions(false);
        }} /></span>}</h1>
        <div><b>Elevation Based On:</b></div>
        <Select
            onChange={(value) => { updateElevationApproach(value) }}
            style={{ width: 300 }}
            placeholder="Elevation Based On"
            value={elevationApproach}
        >
            <Option value="turnoutAbsSameDayVs2020">Current Votes vs. 2020 @ Same Day</Option>
            <Option value="vs2018Abs">Current Votes vs. 2018 Abs @ Same Day</Option>
            <Option value="turnoutVs2020">Current Votes vs. 2020</Option>
            <Option value="turnoutVs2018">Current Votes vs. 2018</Option>
            <Option value="turnoutVs2016">Current Votes vs. 2016</Option>
            <Option value="votes">Current Votes</Option>
            <Option value="votesYest">Votes Yesterday</Option>
            <Option value="votesYestPer2018">Votes Yesterday vs. 2018</Option>
            <Option value="none">None</Option>
        </Select>
        <br /><br />
        <div><b>Color Based On:</b></div>
        <Select
            onChange={(value) => { updateColorApproach(value) }}
            style={{ width: 300 }}
            placeholder="Color Based On"
            value={colorApproach}
            virtual={false}
        >
            <Option value="turnoutAbsSameDayVs2020">Current Votes vs. 2020 @ Same Day</Option>
            <Option value="turnoutAbsSameDayVs2018">Current Votes vs. 2018 @ Same Day</Option>
            <Option value="perRepublican2020">2020 Results</Option>
            <Option value="perRepublican2018">2018 Results</Option>
            <Option value="perRepublican2016">2016 Results</Option>
            <Option value="shift2020To2016">Margin Shift % from 2016 to 2020</Option>
            <Option value="shift2020To2018">Margin Shift % from 2018 to 2020</Option>
            <Option value="shift2018To2016">Margin Shift % from 2016 to 2018</Option>
            <Option value="marginShift2020To2016">Net Gain from 2016 to 2020</Option>
            <Option value="marginShift2020To2018">Net Gain from 2018 to 2020</Option>
            <Option value="turnoutVs2018">Current Votes vs. 2018</Option>
            <Option value="turnoutVs2016">Current Votes vs. 2016</Option>
            <Option value="turnout2018Vs2016">Current Votes 2018 vs. 2016</Option>
            <Option value="democratTurnoutVs2016">Democrat Votes % Change from 2016</Option>
            <Option value="democratTurnoutVs2018">Democrat Votes % Change from 2018</Option>
            <Option value="republicanTurnoutVs2018">Republican Votes % Change from 2016</Option>
            <Option value="republicanTurnoutVs2016">Republican Votes % Change from 2018</Option>
        </Select>
        <br /><br />
        <Checkbox checked={show2018Data} onChange={(e) => { updateShow2018Data(e.target.checked) }}>Show 2018 Data</Checkbox><br />
        <Checkbox checked={show2016Data} onChange={(e) => { updateShow2016Data(e.target.checked) }}>Show 2016 Data</Checkbox>
        <br /><br /></React.Fragment>
} 