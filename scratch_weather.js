const API_KEY = "c5d369f4fe4e4ffa9ed83005262405";
const BASE_URL = "https://api.weatherapi.com/v1";
const lat = 27.7172;
const lon = 85.324;

async function checkWeather() {
  try {
    const res = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=5&aqi=no`);
    const data = await res.json();
    console.log("Current Temp:", data.current.temp_c);
    console.log("Current Condition:", data.current.condition);
    console.log("Forecast Days:");
    data.forecast.forecastday.forEach((d, idx) => {
      console.log(`Day ${idx}: ${d.date} | Max Temp: ${d.day.maxtemp_c} | Min Temp: ${d.day.mintemp_c} | Code: ${d.day.condition.code} | Text: ${d.day.condition.text} | Rain chance: ${d.day.daily_chance_of_rain}%`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

checkWeather();
