import './App.css';
import {FormControl, FormLabel, RadioGroup, Radio, Grid, FormControlLabel, MenuItem, InputLabel, Select} from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import BarChart from './BarChart';
import PCP from './PCP'
import Map from './Map';
import ScatterPlot from './ScatterPlot';

function App() {

  const [feature, setFeature] = useState("Co2-Emissions")
  const [k, setK] = useState(4)
  const [orderVars, setOrderVars] = useState([])
  const [scatterVariables, setScatterVariables] = useState({})
  const [currentAxis, setCurrentAxis] = useState("X")
  const [countries, setCountries] = useState(["United States", "China", "India","Canada", "Japan", "Saudi Arabia"])

  const features = ["Co2-Emissions", "GDP", "Population", "Life expectancy"]
  const variables = ["Co2-Emissions", "GDP", "Population", "Life expectancy", "Sales","Order Total","Profit Per Order","Product Price"]

  function handleSetFeature(e){
    console.log("selected: " + e.target.value)
    setFeature(e.target.value)
  }

  function handleSelectScatterVar(e) {
    var tempVars={...scatterVariables}
    if (currentAxis=="X"){
      tempVars.x = e.target.value
    }
    else{
      tempVars.y = e.target.value
    }
    setScatterVariables(tempVars);
  }

  return (
    <div className="App" height="100%">
        <Toolbar style={{backgroundColor: "#353944"}}>
          <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
          <b>Interrelations Between Consumption and Country Development</b>
          </Typography>
        </Toolbar>
      
      {/* Top Row */}
      <Grid container>
        {/* Map */}
        <Grid item style={{"padding-left": "40px"}}>
          <Grid container direction="column" justifyContent={"center"} alignItems={"center"}>
            <h1>World Heatmap of {feature}</h1>
            <Map countries={countries} setCountries={setCountries} feature={feature}></Map>
            {/* Radio Control for Map*/}
            <Grid item alignContent={"center"} alignItems={"center"} justifyContent={"center"}>
              <FormControl sx={{ m: 1, width: 600 }}>
                <RadioGroup
                  defaultValue={features[0]}
                  onChange={handleSetFeature}
                  row 
                >
                  {features.map((f)=>{
                    return <FormControlLabel value={f} control={<Radio />} label={f}></FormControlLabel>
                  })}
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Scatter Plot */}
        <Grid item>
          <Grid container direction="column" justifyContent={"center"} alignItems={"center"} alignContent={"center"}>
            <h1>Scatter Plot</h1>
            <ScatterPlot k={k} scatterVariables={scatterVariables}></ScatterPlot>
          </Grid> 
        </Grid>
        <Grid item justifyContent={"center"} alignItems={"center"} alignContent={"center"}>
            <FormControl >  
              <InputLabel style={{color: "white"}}>Variable</InputLabel>
              <Select
                defaultValue = ""
                label="Variable"
                onChange={handleSelectScatterVar}
                style={{color:"white"}}
              >
                {variables.map((key) =>(
                  <MenuItem value={key}>{key}</MenuItem>
                ))}  
              </Select>
              <RadioGroup
                defaultValue="X"
                name="axisRadio"
                row
                onChange={e => setCurrentAxis(e.target.value)}
              >
                <FormControlLabel value="X" control={<Radio />} label="X" />
                <FormControlLabel value="Y" control={<Radio />} label="Y" />
              </RadioGroup>
            </FormControl>
        </Grid>
      </Grid>
      
      {/* Bottom Row */}
      <Grid container>
        <Grid item>
          <Grid container direction="column" justifyContent={"center"} alignItems={"center"}>
            <h1 style={{"padding-bottom": "-10px"}}>Parallel Coordinates Plot</h1>
            <PCP k={k} orderVars={orderVars} countries={countries}></PCP>
          </Grid> 
        </Grid>
        <Grid item>
        {/* Bar Chart */}
        <Grid item>
          <Grid container direction="column" justifyContent={"center"} alignItems={"center"} >
            <h1>K-Means MSE Plot</h1>
              <BarChart k={k} setK={setK}></BarChart>
          </Grid>
        </Grid> 
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
