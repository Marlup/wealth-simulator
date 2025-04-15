import json
from typing import List, Tuple

class TaxCalculator:
    def __init__(self, json_path: str = "tax_brackets.json"):
        with open(json_path, "r", encoding="utf-8") as file:
            data = json.load(file)
            self.tax_data = data.get("countries", {})

    def compute_taxes(self, earnings: float, n_yields: int = 1, country: str = "spain") -> float:
        country_key = country.lower()
        if country_key not in self.tax_data:
            raise ValueError(f"No tax brackets defined for country: {country}")

        brackets: List[dict] = self.tax_data[country_key]["tax_brackets"]
        tax_value = 0.0
        lower_limit = 0.0

        for bracket in brackets:
            upper_limit = bracket["upper_limit"] if bracket["upper_limit"] is not None else float("inf")
            rate = bracket["rate"]
            if earnings > lower_limit:
                taxable = min(earnings, upper_limit) - lower_limit
                tax_value += taxable * rate
                lower_limit = upper_limit
            else:
                break

        return tax_value / n_yields
