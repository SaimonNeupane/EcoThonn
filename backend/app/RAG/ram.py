from pipeline import ask, SoilSenseInput

result = ask(SoilSenseInput(
    soil_type="Red_Soil",
    confidence=0.78,
    location="Chitwan, Nepal",
    elevation_m=200,
    temp_celsius=32,
    humidity_percent=75,
    rainfall_last_7d_mm=5,
    rainfall_forecast_14d_mm=80,
    season="Pre-monsoon",
    days_since_last_rain=3,
    query="What vegetables should I plant this month?"
))
print(result)