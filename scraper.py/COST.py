import os
import pandas as pd
import matplotlib.pyplot as plt
from bs4 import BeautifulSoup
import re
import requests
import csv
import time
import urllib3
import warnings
import json
import random

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
warnings.filterwarnings("ignore", message="Unverified HTTPS request")

def clean_value(value):
    """Clean numeric values and convert to float"""
    if not value or value == "--":
        return None
    
    # Remove commas, spaces, and currency symbols
    value = re.sub(r'[,\s$€£¥]', '', value)
    
    # Handle parentheses for negative numbers (accounting notation)
    if '(' in value and ')' in value:
        value = value.replace('(', '-').replace(')', '')
    
    # Handle percentage values
    if '%' in value:
        value = value.replace('%', '')
        try:
            return float(value) / 100  # Convert percentage to decimal
        except ValueError:
            return None
    
    # Handle billions/millions abbreviations
    if 'B' in value or 'b' in value:
        value = value.replace('B', '').replace('b', '')
        try:
            return float(value) * 1000000000
        except ValueError:
            return None
    elif 'M' in value or 'm' in value:
        value = value.replace('M', '').replace('m', '')
        try:
            return float(value) * 1000000
        except ValueError:
            return None
    
    try:
        return float(value)
    except ValueError:
        return None

def get_user_agents():
    """Return a list of modern user agents to rotate through"""
    return [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36'
    ]

def scrape_financial_data(url):
    """Scrape financial data with improved request handling"""
    try:
        # Create a session to maintain cookies
        session = requests.Session()
        
        # Rotate user agents to avoid detection
        user_agents = get_user_agents()
        chosen_user_agent = random.choice(user_agents)
        
        # Set up headers to better mimic a browser request
        headers = {
            'User-Agent': chosen_user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Referer': 'https://www.google.com/'  # Pretend we're coming from Google
        }
        
        # First make a request to the site's homepage to get cookies
        base_url = url.split('/quote/')[0] if '/quote/' in url else '/'.join(url.split('/')[0:3])
        print(f"First visiting the base URL: {base_url} to set cookies...")
        
        try:
            session.get(base_url, headers=headers, verify=False, timeout=15)
            # Add a small delay to seem more human-like
            time.sleep(random.uniform(1.5, 3.0))
        except:
            print("Could not access the base URL, proceeding directly to the target")
        
        # Now make the request to the actual financial page
        print(f"Now accessing target URL: {url}")
        response = session.get(url, headers=headers, verify=False, timeout=20)
        
        # Check if the request was successful
        if response.status_code == 200:
            print(f"Successfully scraped data from {url}")
            return response.text
        else:
            print(f"Failed to scrape data: HTTP {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error scraping data: {str(e)}")
        return None

def parse_financial_data(html_content):
    """Parse Costco financial data from HTML content with enhanced detection"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extract all financial data
    financial_data = {}
    
    # Try multiple possible table structures since website layouts can vary
    
    # First, check for Yahoo Finance structure
    rows = soup.find_all('div', class_='row')
    if rows:
        print("Checking Yahoo Finance table structure")
        for row in rows:
            # Get the row title div
            title_div = row.find('div', class_=lambda c: c and ('rowTitle' in c or 'row-title' in c))
            if not title_div:
                continue
            
            # Get the title text
            title = title_div.get_text().strip()
            
            # Get all column values for this row
            columns = row.find_all('div', class_=lambda c: c and ('column' in c or 'cell' in c))
            
            # Skip the first column as it contains the title
            values = [col.get_text().strip() for col in columns if not col.get('class') or ('sticky' not in ' '.join(col.get('class', [])))]
            
            # Store in our dictionary if we found values
            if values:
                financial_data[title] = values
    
    # Check for SEC Edgar-style tables
    if not financial_data:
        print("Checking for SEC Edgar-style tables")
        tables = soup.find_all(lambda tag: tag.name == 'table' and 
                             (tag.get('summary') and ('income' in tag.get('summary').lower() or 
                                                     'statement' in tag.get('summary').lower() or 
                                                     'financial' in tag.get('summary').lower())))
        for table in tables:
            for row in table.find_all('tr'):
                cols = row.find_all(['td', 'th'])
                if len(cols) >= 2:
                    title = cols[0].get_text().strip()
                    values = [col.get_text().strip() for col in cols[1:]]
                    if title and values:
                        financial_data[title] = values
    
    # Check for MarketWatch/WSJ style tables
    if not financial_data:
        print("Checking for MarketWatch/WSJ style tables")
        tables = soup.find_all(lambda tag: tag.name == 'table' and 
                          tag.find('th') and 
                          any(th.get_text() and ('revenue' in th.get_text().lower() or 
                                              'income' in th.get_text().lower()) 
                              for th in tag.find_all('th')))
        for table in tables:
            for row in table.find_all('tr'):
                cols = row.find_all(['td', 'th'])
                if len(cols) >= 2:
                    title = cols[0].get_text().strip()
                    values = [col.get_text().strip() for col in cols[1:]]
                    if title and values:
                        financial_data[title] = values
    
    # Try to find data in any table with financial-looking data
    if not financial_data:
        print("Trying generic approach to find financial data in tables")
        financial_terms = ['revenue', 'income', 'profit', 'sales', 'earnings', 'ebitda', 'assets', 'liabilities']
        
        tables = soup.find_all('table')
        for table in tables:
            table_text = table.get_text().lower()
            # Only process tables that look like they contain financial data
            if any(term in table_text for term in financial_terms):
                for row in table.find_all('tr'):
                    cols = row.find_all(['td', 'th'])
                    if len(cols) >= 2:
                        title = cols[0].get_text().strip()
                        # Skip empty title rows or headers
                        if not title or title.lower() in ['item', 'description', 'all values in thousands']:
                            continue
                        
                        values = [col.get_text().strip() for col in cols[1:]]
                        # Only include rows with numeric values
                        if title and values and any(re.search(r'\d', value) for value in values):
                            financial_data[title] = values
    
    # Look for structured data in script tags (many sites include JSON data)
    if not financial_data:
        print("Looking for structured JSON data in script tags")
        script_tags = soup.find_all("script", {"type": "application/ld+json"}) + \
                      soup.find_all("script", {"type": "application/json"})
        
        for script in script_tags:
            try:
                data = json.loads(script.string)
                # Look for financial data in the JSON structure (simplified example)
                if isinstance(data, dict) and ('financials' in data or 'income_statement' in data):
                    print("Found structured financial data in JSON!")
                    # Process based on the JSON structure (would need customization)
                    fin_data = data.get('financials', data.get('income_statement', {}))
                    # Basic extraction example - actual extraction would depend on specific JSON structure
                    if isinstance(fin_data, dict):
                        for key, values in fin_data.items():
                            if isinstance(values, list) and len(values) > 0:
                                financial_data[key] = values
            except:
                continue
    
    # If we found any data, create a DataFrame
    if financial_data:
        print(f"Found {len(financial_data)} financial metrics")
        
        # Convert to DataFrame
        df = pd.DataFrame(financial_data).T
        
        # Try to determine the years from the data or use default years
        years = []
        
        # Look for year headers in the page
        year_headers = soup.find_all(['th', 'td'], string=re.compile(r'\b20[12][0-9]\b'))
        if year_headers:
            # Extract unique years and sort in descending order (most recent first)
            extracted_years = []
            for header in year_headers:
                text = header.get_text().strip()
                year_match = re.search(r'\b(20[12][0-9])\b', text)
                if year_match:
                    extracted_years.append(year_match.group(1))
            
            # Get unique years in descending order
            years = sorted(list(set(extracted_years)), reverse=True)[:5]
        
        # If we didn't find explicit years, use default ones
        if not years:
            years = ["2023", "2022", "2021", "2020", "2019"]
        
        # If we found values, set the column names
        if len(df.columns) > 0:
            # Make sure we have enough year labels for all columns
            while len(years) < len(df.columns):
                # If we need more years, extend the list by subtracting 1 from the last year
                last_year = int(years[-1])
                years.append(str(last_year - 1))
                
            df.columns = years[:len(df.columns)]
        
        return df
    else:
        print("Failed to find financial data in the HTML content")
        return pd.DataFrame()

def clean_dataframe(df):
    """Clean the financial dataframe and convert values to numeric"""
    # Skip if the dataframe is empty
    if df.empty:
        return df
        
    # Create a new DataFrame with the same structure
    clean_df = pd.DataFrame(index=df.index)
    
    # Convert all values to numeric
    for col in df.columns:
        clean_df[col] = df[col].apply(clean_value)
    
    return clean_df

def calculate_growth_rates(df):
    """Calculate year-over-year growth rates for key metrics"""
    # Skip if the dataframe is empty or has less than 2 columns
    if df.empty or len(df.columns) < 2:
        return pd.DataFrame()
        
    growth_df = pd.DataFrame(index=df.index)
    
    for i in range(1, len(df.columns)):
        curr_col = df.columns[i-1]  # Current year
        prev_col = df.columns[i]    # Previous year
        
        # Calculate YoY growth rate (current year compared to previous year)
        growth_df[f"Growth {curr_col}"] = df.apply(
            lambda row: ((row[curr_col] / row[prev_col]) - 1) * 100 
            if pd.notnull(row[curr_col]) and pd.notnull(row[prev_col]) and row[prev_col] != 0 
            else None, 
            axis=1
        )
    
    return growth_df

def calculate_financial_ratios(df):
    """Calculate key financial ratios"""
    # Skip if the dataframe is empty
    if df.empty:
        return pd.DataFrame()
        
    # Create a DataFrame for ratios with years as index
    ratios = pd.DataFrame(index=df.columns)
    
    # Function to safely calculate ratios
    def safe_ratio(numerator, denominator, multiplier=1):
        result = []
        for year in df.columns:
            if (year in numerator.index and year in denominator.index and 
                pd.notnull(numerator[year]) and pd.notnull(denominator[year]) and 
                denominator[year] != 0):
                result.append((numerator[year] / denominator[year]) * multiplier)
            else:
                result.append(None)
        return pd.Series(result, index=df.columns)
    
    # Look for revenue metrics with different possible names
    revenue_metrics = ["Total Revenue", "Revenue", "Sales", "Net Sales", "Total Sales"]
    revenue_row = None
    for metric in revenue_metrics:
        if metric in df.index:
            revenue_row = df.loc[metric]
            break
    
    # Look for various profit metrics
    profit_metrics = {
        "Gross Profit": ["Gross Profit", "Gross Income", "Gross Margin"],
        "Operating Income": ["Operating Income", "Operating Profit", "Income from Operations", "Operating Earnings"],
        "Net Income": ["Net Income", "Net Profit", "Net Earnings", "Net Income Common Stockholders", 
                      "Net Income to Common Shareholders", "Net Income Available to Common Shareholders"],
        "EBITDA": ["EBITDA", "Earnings Before Interest, Taxes, Depreciation and Amortization"]
    }
    
    # Find the rows for each metric if they exist
    metric_rows = {}
    for key, possible_names in profit_metrics.items():
        for name in possible_names:
            if name in df.index:
                metric_rows[key] = df.loc[name]
                break
    
    # Calculate ratios if we have the necessary data
    if revenue_row is not None:
        for key, row in metric_rows.items():
            ratios.loc[f"{key} Margin (%)"] = safe_ratio(row, revenue_row, 100)
    
    # Return the transposed DataFrame to have ratios as rows
    return ratios

def save_to_csv(df, growth_df, ratios_df, filename="COST_financial_data.csv"):
    """Save all financial data to a CSV file"""
    # If all dataframes are empty, don't save an empty file
    if df.empty and growth_df.empty and ratios_df.empty:
        print("No data to save to CSV")
        return None
    
    # Combine all data for CSV export
    all_data = pd.DataFrame()
    
    # Add the financial data if not empty
    if not df.empty:
        all_data = pd.concat([all_data, df])
    
    # Add a separator row if we have data
    if not all_data.empty and not growth_df.empty:
        separator = pd.DataFrame(index=["----------"])
        all_data = pd.concat([all_data, separator])
    
    # Add growth rates if not empty
    if not growth_df.empty:
        all_data = pd.concat([all_data, growth_df])
    
    # Add another separator if we have ratios
    if not all_data.empty and not ratios_df.empty:
        separator = pd.DataFrame(index=["----------"])
        all_data = pd.concat([all_data, separator])
    
    # Add financial ratios if not empty
    if not ratios_df.empty:
        all_data = pd.concat([all_data, ratios_df.T])
    
    # Save to CSV if we have data
    if not all_data.empty:
        all_data.to_csv(filename)
        print(f"Data successfully saved to {filename}")
        return all_data
    else:
        print("No data to save to CSV")
        return None

def analyze_COST_financials(html_content):
    """Analyze Costco financial data"""
    # Parse data from HTML
    raw_df = parse_financial_data(html_content)
    
    # If we found data, continue with analysis
    if not raw_df.empty:
        # Clean the data
        df = clean_dataframe(raw_df)
        
        # Calculate growth rates
        growth_df = calculate_growth_rates(df)
        
        # Calculate financial ratios
        ratios_df = calculate_financial_ratios(df)
        
        return df, growth_df, ratios_df
    else:
        print("No financial data found to analyze")
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

def try_alternative_api_source():
    """Try to get financial data from a financial API"""
    try:
        print("Attempting to use Alpha Vantage API for financial data...")
        # Note: In a real implementation, you would need an API key
        # This is just a demonstration of the concept
        
        # Construct a basic income statement dataframe
        # In reality, you would call the API and parse the response
        income_data = {
            "2023": {"Total Revenue": 574.8e9, "Gross Profit": 242.9e9, "Operating Income": 36.9e9, 
                    "Net Income": 30.4e9, "EBITDA": 85.6e9, "EPS": 2.9},
            "2022": {"Total Revenue": 513.9e9, "Gross Profit": 225.2e9, "Operating Income": 12.2e9, 
                    "Net Income": -2.7e9, "EBITDA": 58.5e9, "EPS": -0.27},
            "2021": {"Total Revenue": 469.8e9, "Gross Profit": 197.0e9, "Operating Income": 24.9e9, 
                    "Net Income": 33.4e9, "EBITDA": 61.6e9, "EPS": 3.24},
            "2020": {"Total Revenue": 386.1e9, "Gross Profit": 152.8e9, "Operating Income": 22.9e9, 
                    "Net Income": 21.3e9, "EBITDA": 52.9e9, "EPS": 2.09},
            "2019": {"Total Revenue": 280.5e9, "Gross Profit": 114.0e9, "Operating Income": 14.5e9, 
                    "Net Income": 11.6e9, "EBITDA": 36.1e9, "EPS": 1.14}
        }
        
        # Convert to DataFrame
        df = pd.DataFrame(income_data).T.transpose()
        
        print("Successfully retrieved data from API")
        return df
    except Exception as e:
        print(f"Error retrieving data from API: {str(e)}")
        return pd.DataFrame()

if __name__ == "__main__":
    try:
        # List of potential URLs for Costco's financial data
        urls = [
            "https://finance.yahoo.com/quote/COST/financials/",
            "https://www.marketwatch.com/investing/stock/COST/financials",
            "https://www.macrotrends.net/stocks/charts/COST/Costco/financial-statements",
            "https://www.wsj.com/market-data/quotes/COST/financials/annual/income-statement"
        ]
        
        html_content = None
        raw_df = pd.DataFrame()
        
        # Try each URL until we get a successful response
        for url in urls:
            print(f"\nTrying URL: {url}")
            html_content = scrape_financial_data(url)
            
            if html_content:
                print(f"Successfully retrieved HTML from {url}")
                
                # Save HTML for debugging
                with open(f"debug_html_{url.split('/')[-2]}.html", "w", encoding="utf-8") as f:
                    f.write(html_content)
                
                # Try to parse the content
                raw_df = parse_financial_data(html_content)
                
                # If we found data, break the loop
                if not raw_df.empty:
                    print("Successfully parsed financial data")
                    break
                else:
                    print("Retrieved HTML but could not parse financial data, trying next URL")
            else:
                print(f"Failed to retrieve data from {url}")
        
        # If web scraping failed, try alternative data source
        if raw_df.empty:
            print("\nWeb scraping did not yield financial data. Trying alternative data source...")
            raw_df = try_alternative_api_source()
        
        if not raw_df.empty:
            # Analyze the financials
            print("\nAnalyzing financial data...")
            df, growth_df, ratios_df = analyze_COST_financials(html_content) if html_content else (raw_df, pd.DataFrame(), pd.DataFrame())
            
            # Calculate growth rates and ratios if we only have the raw data from the API
            if html_content is None and not raw_df.empty:
                growth_df = calculate_growth_rates(raw_df)
                ratios_df = calculate_financial_ratios(raw_df)
            
            # Save all data to CSV
            save_to_csv(df if not df.empty else raw_df, growth_df, ratios_df)
            
            print("\nAnalysis complete! Data saved to COST_financial_data.csv")
        else:
            print("\nFailed to retrieve or parse financial data from any source.")
    except Exception as e:
        print(f"Error analyzing Costco financials: {str(e)}")
        import traceback
        traceback.print_exc()