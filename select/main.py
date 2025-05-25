# Simple program to add two numbers

def add_numbers(a, b):
    """
    Add two numbers and return the result.
    
    Args:
        a: First number
        b: Second number
        
    Returns:
        Sum of a and b
    """
    return a + b

def main():
    # Get user input
    print("Welcome to the Addition Calculator")
    
    try:
        num1 = float(input("Enter the first number: "))
        num2 = float(input("Enter the second number: "))
        
        # Calculate the sum
        result = add_numbers(num1, num2)
        
        # Display the result
        print(f"The sum of {num1} and {num2} is: {result}")
    except ValueError:
        print("Error: Please enter valid numbers.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# Execute the main function when the script is run directly
if __name__ == "__main__":
    main()
