#!/usr/bin/env python3.11
"""
Aszálymonitoring MCP Server

Provides tools to access drought monitoring data from aszalymonitoring.vizugy.hu
for 5 locations in southern Hungary: Katymár, Dávod, Szederkény, Sükösd, Csávoly.
"""

import requests
from mcp.server.models import InitializationOptions
from mcp.server import Server
from pydantic import BaseModel
from typing import Optional, List, Dict
import json
import html
from datetime import datetime, timedelta

# Initialize the server
server = Server("aszalymonitoring-mcp-server")

# Constants
LOCATIONS = {
    "Katymár": {
        "lat": 46.2167,
        "lon": 19.5667,
        "county": "Bács-Kiskun",
        "uuid": "F5D851F8-27B9-4C70-96C2-CD6906F91D5B"
    },
    "Dávod": {
        "lat": 46.4167,
        "lon": 18.7667,
        "county": "Tolna",
        "uuid": "E07DCC61-B817-4BFF-AB8C-3D4BB35EB7E1"
    },
    "Szederkény": {
        "lat": 46.3833,
        "lon": 19.2500,
        "county": "Bács-Kiskun",
        "uuid": "BAEE61BE-51FA-41BC-AFAF-6AD99E2598AE"
    },
    "Sükösd": {
        "lat": 46.2833,
        "lon": 19.0000,
        "county": "Bács-Kiskun",
        "uuid": "EC63ACE6-990E-40BD-BEE7-CC8581F908B8"
    },
    "Csávoly": {
        "lat": 46.4500,
        "lon": 19.2833,
        "county": "Bács-Kiskun",
        "uuid": "16FFA799-C5E4-42EE-B08F-FA51E8720815"
    }
}

API_URL = "https://aszalymonitoring.vizugy.hu/api.php"
TIMEOUT_SECONDS = 20  # Longer timeout for slow server
MAX_RETRIES = 2  # Retry failed requests

# Parameter IDs (varid) from getvariables API
PARAM_IDS = {
    'drought_index': 16,  # Aszályindex (HDI) - daily, computed
    'water_deficit_35cm': 17,  # Vízhiány 35 cm - daily, computed
    'water_deficit_80cm': 18,  # Vízhiány 80 cm - daily, computed
    'soil_moisture_10cm': 8,  # Talajnedvesség 10 cm - hourly, measured
    'soil_moisture_20cm': 9,  # Talajnedvesség 20 cm - hourly, measured
    'soil_moisture_30cm': 10,  # Talajnedvesség 30 cm - hourly, measured
    'soil_moisture_45cm': 11,  # Talajnedvesség 45 cm (not 50)
    'soil_moisture_60cm': 12,  # Talajnedvesség 60 cm (not 70)
    'soil_moisture_75cm': 13,  # Talajnedvesség 75 cm (not 100)
    'air_temperature': 1,  # Levegőhőmérséklet - hourly, measured
    'soil_temperature_10cm': 2,  # Talajhőmérséklet 10 cm - hourly, measured
    'humidity': 14,  # Relatív páratartalom - hourly, measured
    'precipitation': 15,  # Csapadek60 - hourly, measured
}


class SoilMoisture(BaseModel):
    depth_cm: int
    value: Optional[float] = None


class DroughtData(BaseModel):
    location: str
    county: str
    station_name: Optional[str] = None
    station_distance_km: Optional[float] = None
    drought_index: Optional[float] = None  # HDI
    water_deficit_index: Optional[float] = None  # HDIS
    soil_moisture: List[SoilMoisture] = []
    soil_temperature: Optional[float] = None
    air_temperature: Optional[float] = None
    precipitation: Optional[float] = None
    relative_humidity: Optional[float] = None
    timestamp: str


def fetch_measurements_from_api(statid: str, varid: int, days_back: int = 7) -> Optional[List[Dict]]:
    """
    Fetch measurements from aszalymonitoring.vizugy.hu API.

    Args:
        statid: Station ID (UUID)
        varid: Parameter ID (from PARAM_IDS)
        days_back: Number of days to fetch (default: 7)

    Returns:
        List of measurements [{"value": "1.89727", "date": "2025-10-27"}, ...]
        or None if API call fails
    """
    try:
        today = datetime.now()
        fromdate = (today - timedelta(days=days_back)).strftime('%Y-%m-%d')
        todate = today.strftime('%Y-%m-%d')

        for attempt in range(MAX_RETRIES):
            try:
                response = requests.post(
                    API_URL,
                    data={
                        'view': 'getmeas',
                        'statid': statid,
                        'varid': str(varid),
                        'fromdate': fromdate,
                        'todate': todate
                    },
                    headers={'User-Agent': 'Mozilla/5.0'},
                    timeout=TIMEOUT_SECONDS
                )

                if response.status_code == 200:
                    # Parse HTML-encoded JSON
                    decoded = html.unescape(response.text)
                    data = json.loads(decoded)

                    # API returns: {"entries": [[{...}, {...}]]}
                    entries = data.get('entries', [])
                    if entries and len(entries) > 0 and isinstance(entries[0], list):
                        return entries[0]  # Return the measurements list

                return None  # No data or unexpected format

            except (requests.Timeout, requests.ConnectionError) as e:
                if attempt < MAX_RETRIES - 1:
                    continue  # Retry
                else:
                    return None  # Give up after retries

        return None

    except Exception as e:
        return None  # API call failed


def fetch_drought_data_for_location(location: str) -> DroughtData:
    """
    Fetch real drought data from API for a specific location.

    Uses aszalymonitoring.vizugy.hu API to fetch real measurements.
    Falls back to None values if API is unavailable.
    """
    if location not in LOCATIONS:
        raise ValueError(f"Unknown location: {location}")

    loc_info = LOCATIONS[location]
    statid = loc_info["uuid"]

    try:
        # Fetch key measurements from API
        # HDI (daily, most recent value)
        hdi_data = fetch_measurements_from_api(statid, PARAM_IDS['drought_index'], days_back=3)
        drought_index = float(hdi_data[-1]['value']) if hdi_data and len(hdi_data) > 0 and hdi_data[-1].get('value') is not None else None

        # Water deficit 35cm (daily, most recent)
        wd_data = fetch_measurements_from_api(statid, PARAM_IDS['water_deficit_35cm'], days_back=3)
        water_deficit = float(wd_data[-1]['value']) if wd_data and len(wd_data) > 0 and wd_data[-1].get('value') is not None else None

        # Soil moisture at different depths (hourly, most recent)
        soil_moisture_data = []
        for depth, varid_key in [
            (10, 'soil_moisture_10cm'),
            (20, 'soil_moisture_20cm'),
            (30, 'soil_moisture_30cm'),
            (45, 'soil_moisture_45cm'),  # Note: API has 45, not 50
            (60, 'soil_moisture_60cm'),  # Note: API has 60, not 70
            (75, 'soil_moisture_75cm')   # Note: API has 75, not 100
        ]:
            sm_data = fetch_measurements_from_api(statid, PARAM_IDS[varid_key], days_back=1)
            value = float(sm_data[-1]['value']) if sm_data and len(sm_data) > 0 and sm_data[-1].get('value') is not None else None
            soil_moisture_data.append(SoilMoisture(depth_cm=depth, value=value))

        # Air temperature (hourly, most recent)
        temp_data = fetch_measurements_from_api(statid, PARAM_IDS['air_temperature'], days_back=1)
        air_temp = float(temp_data[-1]['value']) if temp_data and len(temp_data) > 0 and temp_data[-1].get('value') is not None else None

        # Soil temperature at 10cm (hourly, most recent)
        soil_temp_data = fetch_measurements_from_api(statid, PARAM_IDS['soil_temperature_10cm'], days_back=1)
        soil_temp = float(soil_temp_data[-1]['value']) if soil_temp_data and len(soil_temp_data) > 0 and soil_temp_data[-1].get('value') is not None else None

        # Humidity (hourly, most recent)
        humidity_data = fetch_measurements_from_api(statid, PARAM_IDS['humidity'], days_back=1)
        humidity = float(humidity_data[-1]['value']) if humidity_data and len(humidity_data) > 0 and humidity_data[-1].get('value') is not None else None

        # Precipitation (hourly, most recent)
        precip_data = fetch_measurements_from_api(statid, PARAM_IDS['precipitation'], days_back=1)
        precip = float(precip_data[-1]['value']) if precip_data and len(precip_data) > 0 and precip_data[-1].get('value') is not None else None

        # Build DroughtData with real API values
        drought_data = DroughtData(
            location=location,
            county=loc_info["county"],
            station_name=f"{location} monitoring állomás",
            station_distance_km=0.0,  # Station itself
            drought_index=drought_index,
            water_deficit_index=water_deficit,
            soil_moisture=soil_moisture_data,
            soil_temperature=soil_temp,
            air_temperature=air_temp,
            precipitation=precip,
            relative_humidity=humidity,
            timestamp=datetime.now().isoformat()
        )

        return drought_data

    except Exception as e:
        raise Exception(f"Failed to fetch drought data from API: {str(e)}")


def format_drought_data_markdown(data: DroughtData) -> str:
    """Format drought data as markdown."""
    soil_moisture_rows = []
    for sm in data.soil_moisture:
        value_str = f"{sm.value:.1f}%" if sm.value is not None else "N/A"
        soil_moisture_rows.append(f"| {sm.depth_cm} cm | {value_str} |")

    soil_table = "| Mélység | Talajnedvesség |\n|---------|---------------|\n" + "\n".join(soil_moisture_rows)

    return f"""# Aszálymonitoring - {data.location}

**Megye**: {data.county}
**Állomás**: {data.station_name} ({data.station_distance_km:.1f} km távolság)

## Aszályindexek

- **Aszályindex (HDI)**: {data.drought_index:.1f}
- **Vízhiány index (HDIS)**: {data.water_deficit_index:.1f}

## Talajnedvesség

{soil_table}

## Meteorológiai Adatok

- **Talajhőmérséklet**: {data.soil_temperature:.1f}°C
- **Léghőmérséklet**: {data.air_temperature:.1f}°C
- **Csapadék**: {data.precipitation:.1f} mm
- **Relatív páratartalom**: {data.relative_humidity:.1f}%

*Frissítve*: {data.timestamp}"""


def format_all_drought_data_markdown(data_list: List[DroughtData]) -> str:
    """Format multiple drought data as markdown summary."""
    rows = []
    for data in data_list:
        rows.append(
            f"| {data.location} | {data.drought_index:.1f} | "
            f"{data.soil_moisture[0].value:.1f}% | {data.air_temperature:.1f}°C |"
        )

    table = "| Helyszín | Aszályindex | Talajnedv (10cm) | Léghőm. |\n" \
            "|----------|-------------|------------------|----------|\n" + "\n".join(rows)

    return f"""# Aszálymonitoring Összesítő

{table}

*HDI (Hungarian Drought Index)*: 0-100 skála (magasabb = szárazabb)
*Talajnedvesség*: % (optimális: 30-40%)

*Frissítve*: {datetime.now().isoformat()}"""


# MCP Tools
@server.list_tools()
async def list_tools():
    """List available tools."""
    return [
        {
            "name": "get_drought_data",
            "description": "Get drought monitoring data for a specific location (Katymár, Dávod, Szederkény, Sükösd, or Csávoly)",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "enum": ["Katymár", "Dávod", "Szederkény", "Sükösd", "Csávoly"],
                        "description": "Location name"
                    },
                    "format": {
                        "type": "string",
                        "enum": ["json", "markdown"],
                        "default": "json",
                        "description": "Response format"
                    }
                },
                "required": ["location"]
            }
        },
        {
            "name": "get_all_drought_data",
            "description": "Get drought monitoring data for all 5 locations",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "format": {
                        "type": "string",
                        "enum": ["json", "markdown"],
                        "default": "json",
                        "description": "Response format"
                    }
                }
            }
        },
        {
            "name": "list_locations",
            "description": "List all available drought monitoring locations with coordinates",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        }
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    """Handle tool calls."""
    try:
        if name == "get_drought_data":
            location = arguments.get("location", "Katymár")
            fmt = arguments.get("format", "json")

            data = fetch_drought_data_for_location(location)

            if fmt == "markdown":
                return format_drought_data_markdown(data)
            else:
                return json.dumps(data.model_dump(), indent=2)

        elif name == "get_all_drought_data":
            fmt = arguments.get("format", "json")

            data_list = [
                fetch_drought_data_for_location(loc) for loc in LOCATIONS.keys()
            ]

            if fmt == "markdown":
                return format_all_drought_data_markdown(data_list)
            else:
                return json.dumps([d.model_dump() for d in data_list], indent=2)

        elif name == "list_locations":
            locations_info = []
            for name, info in LOCATIONS.items():
                locations_info.append({
                    "name": name,
                    "county": info["county"],
                    "lat": info["lat"],
                    "lon": info["lon"]
                })

            return json.dumps(locations_info, indent=2)

        else:
            return f"Unknown tool: {name}"

    except Exception as e:
        return f"Error: {str(e)}"


async def main():
    """Start the MCP server."""
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="aszalymonitoring-mcp",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities={},
                )
            )
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
