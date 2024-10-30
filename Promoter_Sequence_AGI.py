# To return a csv file of the three AGIs
import csv

# To convert a string of lists into a list
import ast

# To extract the bZIP values from the file name
import re


def get_nucleotide_numbers(narrowpeak_file:str):
    """
    Store the chromosome number, nucelotide at the start peak and end peak.
    """
    input = open(narrowpeak_file, "r")

    for line in input:
        print(line)
        string_stripped = line.strip("\n")
        store = string_stripped.split("\t")
        print(store)

        chromosome_number = store[0]
        peak_first_nucleotide = store[1]
        peak_last_nucleotide = store[2]


    # Now find that in the other file:
        bZIPs_involved_AGIs = get_bZIP_AGIS(narrowpeak_file)
        check_range(chromosome_number,peak_first_nucleotide,peak_last_nucleotide,bZIPs_involved_AGIs)



def check_range(chr_no: int, peak_first:int,peak_end: int, bZIP_agis: tuple):

    input = open("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\5' UTR_extracted_updated.txt", "r")
    for line in input:
        list = ast.literal_eval(line)
        # Find the matching chromosome

        if chr_no == int(list[0][3]):
            promoter_range_start = list[9][0]
            promoter_range_end = list[9][1]

            if peak_first and peak_end in range(promoter_range_start, promoter_range_end):
                promoter_seq_AGI = list[8].split('=')[1].strip("\n")
                populate_csv(bZIP_agis[0], bZIP_agis[1], promoter_seq_AGI)

        break

check_range(5,10,15)


def get_bZIP_AGIS(input_file: str) -> tuple[str,str]:

    # Example file path
    file_path = input_file
    # Use regex to find all occurrences of bZIP followed by numbers
    bZIPs_involved = re.findall(r'bZIP\d+', file_path)

    # Display the results
    print("Extracted bZIP numbers:", bZIPs_involved)

    # Now find the bZIP agis
    AGI_file = open("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\bZIP_AGIS.txt", "r")
    for line in AGI_file:
        if str(bZIPs_involved[0]) in line:
            TF1 = line.split(':')[1].strip("\n")
            print(TF1)

        if str(bZIPs_involved[1]) in line:
            TF2 = line.split(':')[1].strip("\n")
            print(TF2)

    return (TF1,TF2)


get_bZIP_AGIS(r"C:\Users\Tanaya\OneDrive - University of Toronto\BCB330Y\GSE198873_DAPSeq-bZIP..bZIP_rr-ps-bZIP11..ph-bZIP9_Col..h-B-nuc1_GPS_events.narrowPeak")





# hence agis  = [[TF1,TF2, PS],[bzip1 AGI, bZIP2 AGI2, insert here],[bZIP AGI1, bZIPAGI 2],[]]

def populate_csv(tf1_agi: str, tf2_agi: str, promoter_seq_agi: str):
    """
    Populate a CSV file, with the TF1,TF2 and the promoter sequence it binds to.

    :return: a CSV file
    """
    AGI_data = []
    one_possibility = [tf1_agi, tf2_agi, promoter_seq_agi]
    AGI_data.append(one_possibility)

    with open('output.csv', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(AGI_data)

    print("CSV file created!")
