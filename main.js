const MONTHS_IN_YEAR = 12;
const CURRENT_YEAR = new Date().getFullYear();

export let simulationParams = {};  // ✅ updated on each simulation

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
    tax: document.getElementById("tax_rate").value   // country name or numeric rate
  };
}

function setSimulationResults(params) {
  simulationParams = params;
}

export function simulate() {
  const params = getInputs();
  const nYieldsPerYear = Math.floor(MONTHS_IN_YEAR / params.yield_frequency);
  const periodicROI = params.annual_roi / nYieldsPerYear;
  const retirementStart = params.retirement_at * MONTHS_IN_YEAR;
  let monthlyContribution = params.annual_contribution / MONTHS_IN_YEAR;
  const monthlyInc = params.inc_contribution_rate / MONTHS_IN_YEAR;

  let currentBalance = params.principal;
  let accumContribution = monthlyContribution;
  let time = 0;
  let onRetirement = false;
  let earningsWindow = [];

  const balances = [];
  const contributions = [];
  const grossEarnings = [];
  const netEarnings = [];
  const taxEarnings = [];

  for (let y = 0; y < params.investment_duration; y++) {
    for (let m = 1; m <= MONTHS_IN_YEAR; m++) {
      const isYieldPeriod = (m % params.yield_frequency === 0) && currentBalance > 0;
      if (isYieldPeriod) {
        const gross = currentBalance * periodicROI;
        const infl = gross * (params.inflation_rate / nYieldsPerYear);
        const net = gross - infl;

        earningsWindow.push(net);
        if (earningsWindow.length > nYieldsPerYear) earningsWindow.shift();

        currentBalance += gross;

        let tax = 0;
        if (params.tax !== "") {
          if (isNaN(parseFloat(params.tax))) {
            // fallback to default flat rate (simulate JSON-based Python logic)
            tax = 0.21 * net / nYieldsPerYear;
          } else {
            tax = parseFloat(params.tax) * net / nYieldsPerYear;
          }
        }

        grossEarnings.push(gross);
        taxEarnings.push(tax);
        netEarnings.push(net - tax);
      }

      if (!onRetirement && time >= retirementStart) {
        onRetirement = true;
        monthlyContribution = 0;
      }

      const outflow = onRetirement ? params.monthly_retirement_income : 0;
      currentBalance += monthlyContribution - outflow;

      const balanceInflation = currentBalance * (params.inflation_rate / MONTHS_IN_YEAR);
      currentBalance -= balanceInflation;

      if (!onRetirement && monthlyInc > 0) {
        monthlyContribution += monthlyContribution * monthlyInc;
      }

      balances.push(currentBalance);
      accumContribution += monthlyContribution;
      contributions.push(accumContribution);
      time++;
    }

    if (params.tax !== "" && earningsWindow.length > 0) {
      const sumEarnings = earningsWindow.reduce((a, b) => a + b, 0);
      const windowTax = isNaN(parseFloat(params.tax))
        ? 0.21 * sumEarnings / 1
        : parseFloat(params.tax) * sumEarnings / 1;
      currentBalance -= windowTax;
    }
  }

  setSimulationResults(params);
  return { balances, contributions, grossEarnings, netEarnings, taxEarnings };
}

function plot() {
  const data = simulate();
  const params = simulationParams;

  // Update UI with current parameters
  const months = data.balances.map((_, i) => i);
  const years = months.map(i => Math.floor(i / 12));
  const current_years = months.map(i => CURRENT_YEAR + Math.floor(i / 12));
  const yield_terms = data.netEarnings.map((_, i) => i);
  const monthNames = months.map(i => (i % 12) + 1);  // 1 to 12

  /*
  Plotly.react("plot_balance", [{
    x: months,
    y: data.balances,
    type: "scatter",
    mode: "lines",
    line: { color: "navy" },
    name: "Balance",
    customdata: years.map((y, i) => [y, current_years[i], monthNames[i]]),
    hovertemplate: 
    "Year: %{customdata[0]} (%{customdata[1]})<br>" +
    "Month: %{customdata[2]}<br>" +
    "Balance (€): %{y:.0f}<extra></extra>"
  }], {
    title: { text: "Balance Over Time" },
    xaxis: { title: { text: "Month" }, gridcolor: 'lightgray' },
    yaxis: { title: { text: "Balance (€)" }, gridcolor: 'lightgray' },
    plot_bgcolor: "#b0c4de",
    paper_bgcolor: "#b0c4de",
    margin: { t: 40 }
  });
  */
  Plotly.react("plot_combined", [
    {
      x: months,
      y: data.balances,
      type: "scatter",
      mode: "lines",
      line: { color: "navy" },
      name: "Balance",
      customdata: years.map((y, i) => [y, current_years[i], monthNames[i]]),
      hovertemplate: 
        "Year: %{customdata[0]} (%{customdata[1]})<br>" +
        "Month: %{customdata[2]}<br>" +
        "Balance (€): %{y:.0f}<extra></extra>"
    },
    {
      x: months,
      y: data.contributions,
      type: "scatter",
      mode: "lines",
      line: { color: "darkgreen" },
      name: "Contributions",
      customdata: years.map((y, i) => [y, current_years[i], monthNames[i]]),
      hovertemplate: 
        "Year: %{customdata[0]} (%{customdata[1]})<br>" +
        "Month: %{customdata[2]}<br>" +
        "Contribution (€): %{y:.0f}<extra></extra>"
    }
  ], {
    title: { text: "Balance and Contributions Over Time" },
    xaxis: { title: { text: "Month" }, gridcolor: 'lightgray' },
    yaxis: { title: { text: "Amount (€)" }, gridcolor: 'lightgray' },
    plot_bgcolor: "#b0c4de",
    paper_bgcolor: "#b0c4de",
    margin: { t: 40 }
  });

  Plotly.react("plot_earnings", [{
    x: yield_terms,
    y: data.netEarnings,
    type: "scatter",
    mode: "lines",
    line: { color: "green" },
    name: "Net Earnings",
    hovertemplate: "Term: %{x}<br>Earning (€): %{y:.1f}<extra></extra>"
  }], {
    title: { text: "Earnings Over Time" },
    xaxis: { title: { text: `Interests frequency (every ${params.yield_frequency} months)` }, gridcolor: 'lightgray' },
    yaxis: { title: { text: "Earning (€)" }, gridcolor: 'lightgray' },
    plot_bgcolor: "#d8eecf",
    paper_bgcolor: "#d8eecf",
    margin: { t: 40 }
  });
}

document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", plot);
});

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
