#!/usr/bin/env python3

import time
import random
import string
import argparse
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

def generate_random_name():
    first_names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Skyler', 'Dakota']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    return random.choice(first_names), random.choice(last_names)

def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + '!@#$%^&*()'
    return ''.join(random.choice(characters) for _ in range(length))

def generate_random_username(first_name, last_name):
    username = f"{first_name.lower()}{last_name.lower()}{random.randint(100, 9999)}"
    return username

def generate_random_dob():
    # Generate a date between 18 and 60 years ago
    year = random.randint(1963, 2005)
    month = random.randint(1, 12)
    day = random.randint(1, 28)  # Simplified to avoid month-specific day limits
    return {'year': year, 'month': month, 'day': day}

def create_google_account(headless=True, custom_info=None):
    print("Starting Google account creation process...")
    
    # Setup Chrome options
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # Initialize the driver
    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 20)
    
    try:
        # Navigate to Google account creation page
        driver.get("https://accounts.google.com/signup")
        print("Navigated to Google signup page")
        
        # Generate or use provided account information
        if custom_info:
            first_name = custom_info.get('first_name')
            last_name = custom_info.get('last_name')
            username = custom_info.get('username')
            password = custom_info.get('password')
            dob = custom_info.get('dob', generate_random_dob())
        else:
            first_name, last_name = generate_random_name()
            username = generate_random_username(first_name, last_name)
            password = generate_random_password()
            dob = generate_random_dob()
        
        # Fill in the form fields
        # First name
        wait.until(EC.presence_of_element_located((By.NAME, "firstName")))
        first_name_field = driver.find_element(By.NAME, "firstName")
        first_name_field.send_keys(first_name)
        print(f"Entered first name: {first_name}")
        
        # Last name
        last_name_field = driver.find_element(By.NAME, "lastName")
        last_name_field.send_keys(last_name)
        print(f"Entered last name: {last_name}")
        
        # Click Next
        driver.find_element(By.XPATH, "//span[text()='Next']/parent::button").click()
        
        # Wait for the username field
        wait.until(EC.presence_of_element_located((By.NAME, "Username")))
        username_field = driver.find_element(By.NAME, "Username")
        username_field.send_keys(username)
        print(f"Entered username: {username}")
        
        # Click Next
        driver.find_element(By.XPATH, "//span[text()='Next']/parent::button").click()
        
        # Wait for the password fields
        wait.until(EC.presence_of_element_located((By.NAME, "Passwd")))
        password_field = driver.find_element(By.NAME, "Passwd")
        password_field.send_keys(password)
        
        confirm_password_field = driver.find_element(By.NAME, "PasswdAgain")
        confirm_password_field.send_keys(password)
        print(f"Entered password: {password}")
        
        # Click Next
        driver.find_element(By.XPATH, "//span[text()='Next']/parent::button").click()
        
        # Wait for the phone verification page
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Verify')]")))
        
        print("\nAccount creation process reached phone verification stage.")
        print("\nACCOUNT INFORMATION:")
        print(f"First Name: {first_name}")
        print(f"Last Name: {last_name}")
        print(f"Username: {username}@gmail.com")
        print(f"Password: {password}")
        print("\nNOTE: You need to complete phone verification manually to finalize the account creation.")
        
        if headless:
            print("\nRunning in headless mode. Please re-run with --no-headless to complete verification.")
        else:
            print("\nPlease complete the phone verification in the browser window.")
            print("The script will wait for 5 minutes before timing out...")
            # Wait for manual interaction
            time.sleep(300)
        
        return {
            'success': True,
            'first_name': first_name,
            'last_name': last_name,
            'username': f"{username}@gmail.com",
            'password': password,
            'status': 'Phone verification required'
        }
        
    except TimeoutException as e:
        print(f"Timeout error: {e}")
        return {'success': False, 'error': 'Timeout waiting for elements'}
    except Exception as e:
        print(f"Error creating account: {e}")
        return {'success': False, 'error': str(e)}
    finally:
        if headless:
            driver.quit()
        else:
            print("\nKeeping browser open for manual verification. Close it when done.")

def main():
    parser = argparse.ArgumentParser(description='Create a Google account automatically')
    parser.add_argument('--no-headless', action='store_true', help='Run in non-headless mode to allow manual verification')
    parser.add_argument('--first-name', help='Custom first name')
    parser.add_argument('--last-name', help='Custom last name')
    parser.add_argument('--username', help='Custom username (without @gmail.com)')
    parser.add_argument('--password', help='Custom password')
    
    args = parser.parse_args()
    
    custom_info = None
    if args.first_name or args.last_name or args.username or args.password:
        custom_info = {
            'first_name': args.first_name,
            'last_name': args.last_name,
            'username': args.username,
            'password': args.password
        }
    
    result = create_google_account(headless=not args.no_headless, custom_info=custom_info)
    
    if result['success']:
        print("\nAccount creation process completed successfully!")
    else:
        print(f"\nAccount creation failed: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()
