const MONTHS_IN_YEAR = 12;

export let simulationParams = {};  // ✅ new export

function setSimulationResults() {
  simulationParams = getInputs();  // ✅ store params
}

function getInputs() {
  return {
    principal: +document.getElementById("principal").value,
    annual_roi: +document.getElementById("roi").value,
    yield_frequency: +document.getElementById("frequency").value,
    annual_contribution: +document.getElementById("contribution").value,
    inc_contribution_rate: +document.getElementById("inc_contribution").value,
    investment_duration: +document.getElementById("duration").value,
    retirement_at: +document.getElementById("retirement_at").value,
    monthly_retirement_income: +document.getElementById("retirement_income").value,
    inflation_rate: +document.getElementById("inflation").value,
    tax_rate: +document.getElementById("tax_rate").value
  };
}

function getInflationAmount(amount, nYields, inflation, years = 1) {
  let adjusted = inflation / nYields;
  if (!(adjusted > 0.0 && adjusted < 1.0)) adjusted = 0.02 / nYields;
  return amount * (1 - 1 / Math.pow(1 + adjusted, years));
}

function getContributionInc(monthlyContribution, monthlyIncrement) {
  return monthlyIncrement > 0 ? monthlyIncrement * monthlyContribution : 0;
}

function getTaxAmount(earnings, nYields, rate) {
  return parseFloat(rate) * earnings / nYields;
}

export function simulate() {
  const params = getInputs();
  const nYieldsPerYear = Math.floor(MONTHS_IN_YEAR / params.yield_frequency);
  const periodicROI = params.annual_roi / nYieldsPerYear;
  const retirementStart = params.retirement_at * MONTHS_IN_YEAR;
  let monthlyContribution = params.annual_contribution / MONTHS_IN_YEAR;
  const monthlyInc = params.inc_contribution_rate / MONTHS_IN_YEAR;

  let currentBalance = params.principal;
  let time = 0;
  let onRetirement = false;
  let earningsWindow = [], 
  balances = [], 
  grossEarnings = [],
  netEarnings = [],
  taxEarnings = []; 

  for (let y = 0; y < params.investment_duration; y++) {
    for (let m = 1; m <= MONTHS_IN_YEAR; m++) {
      
      const yieldPeriod = (m % params.yield_frequency === 0) && currentBalance > 0;
      if (yieldPeriod) {

        const gross = currentBalance * periodicROI;
        const infl = getInflationAmount(gross, nYieldsPerYear, params.inflation_rate);
        const net = gross - infl;
        
        currentBalance += gross;
        
        earningsWindow.push(net);
        if (earningsWindow.length > nYieldsPerYear) 
          earningsWindow.shift();
        
        const tax = getTaxAmount(net, nYieldsPerYear, params.tax_rate);
        
        grossEarnings.push(net);
        taxEarnings.push(tax);
        netEarnings.push(net - tax);
      }
      
      if (!onRetirement && time >= retirementStart) {
        onRetirement = true;
        monthlyContribution = 0;
      }
      const outflow = onRetirement ? params.monthly_retirement_income : 0;
      currentBalance += monthlyContribution - outflow;
      currentBalance -= getInflationAmount(currentBalance, MONTHS_IN_YEAR, params.inflation_rate);
      if (!onRetirement) 
        monthlyContribution += getContributionInc(monthlyContribution, monthlyInc);
      balances.push(currentBalance);
      time++;
    }
    if (params.tax_rate !== "") {
      const sumEarnings = earningsWindow.reduce((a, b) => a + b, 0);
      currentBalance -= getTaxAmount(sumEarnings, 1, params.tax_rate);
    }

    // set simulation results
    setSimulationResults();
  }
  return { balances, grossEarnings, taxEarnings, netEarnings };
}

function plot() {
  const data = simulate();
  const params = getInputs();
  
  const months = data.balances.map((_, i) => i);
  const yield_terms = data.netEarnings.map((_, i) => i);
  
  Plotly.react("plot_balance", [{
    x: months,
    y: data.balances,
    type: "scatter",
    mode: "lines",
    line: { color: "navy" },
    name: "Balance",
    hovertemplate:
    "Month: %{x}<br>Balance (€): %{y:.0f}<extra></extra>"
  }], {
    title: { text: "Balance Over Time" },
    xaxis: { 
        title: { text: "Month" }, 
        gridcolor: 'lightgray',
        gridwidth: 1,
        linewidth: 1,
    },
    yaxis: { 
        title: { text: "Balance (€)" },
        gridcolor: 'lightgray',
        gridwidth: 1,
        linewidth: 1,
      },
      plot_bgcolor: "#b0c4de",       // inner plot area
      paper_bgcolor: "#b0c4de",       // entire plot box
      margin: { t: 40 },
    });
    
  Plotly.react("plot_earnings", [{
    x: yield_terms,
    y: data.netEarnings,
    type: "scatter",
    mode: "lines",
    line: { color: "green" },
    name: "Earning",
    hovertemplate:
      "Year: %{x}<br>Earning (€): %{y:.1f}<extra></extra>"
    }], {
      title: { text: "Earnings Over Time" },
      xaxis: { 
        title: { text: `Yield frequency (${params.yield_frequency} months)` },
        gridcolor: 'lightgray',
        gridwidth: 1,
        linewidth: 1,
      },
      yaxis: { 
        title: { text: "Earning (€)" },
        gridcolor: 'lightgray',
        gridwidth: 1,
        linewidth: 1,
      },
      plot_bgcolor: "#d8eecf",
      paper_bgcolor: "#d8eecf",
      margin: { t: 40 },
    });
  }

document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", plot);
});

// Show current values next to sliders
document.querySelectorAll('input[type="range"]').forEach(slider => {
    const span = document.getElementById("val_" + slider.id);
    if (span) {
      span.textContent = slider.value;
      slider.addEventListener("input", () => {
        span.textContent = slider.value;
      });
    }
  });  

plot();