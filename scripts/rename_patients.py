import re

# 125 unique female Indian names
female_names = [
    "Priya Sharma", "Aisha Patel", "Ananya Iyer", "Deepika Nair", "Priyanka Rao", 
    "Aditi Joshi", "Kavita Reddy", "Sunita Chaudhary", "Meera Krishnan", "Sneha Sen", 
    "Pooja Bannerjee", "Riya Dutta", "Tanvi Hegde", "Divya Saxena", "Shruti Mishra", 
    "Neha Gupta", "Swati Verma", "Shalini Sinha", "Payal Trivedi", "Ritu Kapoor", 
    "Preeti Bhat", "Jyoti Deshmukh", "Nisha Kulkarni", "Geeta Ranganathan", "Lata Seshadri", 
    "Hema Sundaram", "Rekha Subramanian", "Madhuri Dixit", "Kajol Devgn", "Karishma Tanna", 
    "Raveena Tandon", "Shilpa Shetty", "Sushmita Sen", "Aishwarya Rai", "Rani Mukerji", 
    "Preity Zinta", "Kareena Kapoor", "Katrina Kaif", "Deepika Padukone", "Anushka Sharma", 
    "Sonam Kapoor", "Alia Bhatt", "Shraddha Kapoor", "Kriti Sanon", "Kiara Advani", 
    "Sara Ali Khan", "Janhvi Kapoor", "Ananya Panday", "Radhika Apte", "Bhumi Pednekar", 
    "Taapsee Pannu", "Vidya Balan", "Kangana Ranaut", "Priyanka Chopra", "Sonakshi Sinha", 
    "Jacqueline Fernandez", "Yami Gautam", "Ileana Cruz", "Tamannaah Bhatia", "Kajal Aggarwal", 
    "Samantha Ruth", "Rashmika Mandanna", "Nayanthara Kurian", "Keerthy Suresh", "Trisha Krishnan", 
    "Anushka Shetty", "Richa Chadha", "Huma Qureshi", "Swara Bhasker", "Konkona Sen", 
    "Nandita Das", "Shabana Azmi", "Smita Patil", "Waheeda Rehman", "Vyjayanthimala Bali", 
    "Madhubala Deval", "Nargis Dutt", "Nutan Bahl", "Asha Parekh", "Helen Richardson", 
    "Zeenat Aman", "Parveen Babi", "Neetu Singh", "Jaya Bhaduri", "Dimple Kapadia", 
    "Sridevi Kapoor", "Juhi Chawla", "Manisha Koirala", "Urmila Matondkar", "Tabassum Hashmi", 
    "Sonali Bendre", "Twinkle Khanna", "Shilpa Shirodkar", "Karisma Kapoor", "Pooja Bhatt", 
    "Divya Bharti", "Mamta Kulkarni", "Sonali Kulkarni", "Gracy Singh", "Amrita Rao", 
    "Esha Deol", "Lara Dutta", "Dia Mirza", "Celina Jaitly", "Rimi Sen", 
    "Udita Goswami", "Neha Dhupia", "Koena Mitra", "Tanushree Dutta", "Minissha Lamba", 
    "Soha Ali Khan", "Mugdha Godse", "Sayyeshaa Saigal", "Radhika Madan", "Mithila Palkar", 
    "Sanya Malhotra", "Fatima Sana", "Sobhita Dhulipala", "Aditi Rao", "Diana Penty", 
    "Prachi Desai", "Chitrangada Singh", "Esha Gupta", "Nushrratt Bharuccha", "Vaani Kapoor"
]

# 125 unique male Indian names
male_names = [
    "Aarav Kumar", "Vivaan Singh", "Aditya Sharma", "Vihaan Patel", "Arjun Gupta", 
    "Sai Krishna", "Reyansh Reddy", "Aravind Nair", "Aryan Sen", "Krishna Murthy", 
    "Rahul Dravid", "Sachin Tendulkar", "Virat Kohli", "Rohit Sharma", "MS Dhoni", 
    "Yuvraj Singh", "Sourav Ganguly", "Anil Kumble", "Javagal Srinath", "Harbhajan Singh", 
    "Zaheer Khan", "Virender Sehwag", "Gautam Gambhir", "Shikhar Dhawan", "KL Rahul", 
    "Hardik Pandya", "Jasprit Bumrah", "Ravindra Jadeja", "Ravichandran Ashwin", "Cheteshwar Pujara", 
    "Ajinkya Rahane", "Umesh Yadav", "Ishant Sharma", "Mohammed Shami", "Bhuvneshwar Kumar", 
    "Shreyas Iyer", "Rishabh Pant", "Shubman Gill", "Prithvi Shaw", "Ishan Kishan", 
    "Suryakumar Yadav", "Sanju Samson", "Deepak Chahar", "Shardul Thakur", "Axar Patel", 
    "Washington Sundar", "Mohammed Siraj", "Prasidh Krishna", "Devdutt Padikkal", "Ruturaj Gaikwad", 
    "Venkatesh Iyer", "Avesh Khan", "Harshal Patel", "Arshdeep Singh", "Umran Malik", 
    "Ravi Bishnoi", "Kuldeep Yadav", "Yuzvendra Chahal", "Amit Mishra", "Piyush Chawla", 
    "Pragyan Ojha", "Murali Kartik", "Ramesh Powar", "Laxmipathy Balaji", "Ashish Nehra", 
    "Ajit Agarkar", "Sanjay Bangar", "Rohan Gavaskar", "Parthiv Patel", "Dinesh Karthik", 
    "Robin Uthappa", "Suresh Raina", "Irfan Pathan", "Yusuf Pathan", "Sreesanth Nair", 
    "Munaf Patel", "RP Singh", "Manoj Tiwary", "Wriddhiman Saha", "Murali Vijay", 
    "Karun Nair", "Hanuma Vihari", "Abhimanyu Easwaran", "Priyank Panchal", "Kona Srikar", 
    "Jayant Yadav", "Shahbaz Ahmed", "KS Bharat", "Deepak Hooda", "Krunal Pandya", 
    "Shivam Dube", "Vijay Shankar", "Manish Pandey", "Kedar Jadhav", "Ambati Rayudu", 
    "Gurkeerat Singh", "Rishi Dhawan", "Stuart Binny", "Saurabh Tiwary", "Naman Ojha", 
    "S Badrinath", "Abhishek Nayar", "Jaydev Unadkat", "Varun Aaron", "Vinay Kumar", 
    "Abhimanyu Mithun", "Sudeep Tyagi", "Manpreet Gony", "Ranveer Singh", "Ranbir Kapoor", 
    "Hrithik Roshan", "Abhishek Bachchan", "Saif Ali Khan", "Akshay Kumar", "Ajay Devgn", 
    "Sunil Shetty", "Sanjay Dutt", "Sunny Deol", "Bobby Deol", "Anil Kapoor", 
    "Jackie Shroff", "Govinda Ahuja", "Aamir Khan", "Salman Khan", "Shah Rukh Khan"
]

def rename_patients(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Split by 'id: ' which naturally starts each patient block
    parts = content.split("id: '")
    if len(parts) <= 1:
        print("Error: Could not find patient blocks in the file.")
        return

    female_idx = 0
    male_idx = 0

    new_parts = [parts[0]] # Header part remains unchanged

    for part in parts[1:]:
        # Find gender
        gender_match = re.search(r"gender:\s*'([MF])'", part)
        if not gender_match:
            # If no gender in this block, just keep it as is
            new_parts.append("id: '" + part)
            continue
            
        gender = gender_match.group(1)
        
        # Determine the next name
        if gender == 'F':
            if female_idx >= len(female_names):
                raise Exception("Ran out of unique female Indian names!")
            new_name = female_names[female_idx]
            female_idx += 1
        else:
            if male_idx >= len(male_names):
                raise Exception("Ran out of unique male Indian names!")
            new_name = male_names[male_idx]
            male_idx += 1

        # Replace first occurrence of name: '...' in this part
        # Using a regex that captures the name value to replace it
        updated_part, count = re.subn(r"(name:\s*')([^']*)(')", f"\\1{new_name}\\3", part, count=1)
        if count == 0:
            print(f"Warning: Could not replace name in patient block: {part[:100]}")
            
        new_parts.append("id: '" + updated_part)

    # Join the file back
    updated_content = "".join(new_parts)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(updated_content)

    print(f"Successfully renamed {female_idx} female and {male_idx} male patients (Total: {female_idx + male_idx}).")

if __name__ == "__main__":
    rename_patients("src/data/polyclinicPatients.ts")
