# To return a csv file of the three AGIs
import csv

# To convert a string of lists into a list
import ast

# To extract the bZIP values from the file name
import re



# Find matching chromosomes, check if peak in range of 5'UTR, extract promoter_AGI

def check_range(chr_no: int, peak_first:int,peak_end: int, bZIP_agis: tuple, maxima_peak:int, final_list:list, column7: float, column9: float):
    """
    print("inside")
    print(chr_no)
    print(peak_first)
    print(peak_end)
    print(maxima_peak)
    print(final_list)
    """

    input = open("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\5' UTR_extracted_additional_column_revised.txt", "r")
    for line in input:
        row_list = ast.literal_eval(line)
        # Find the matching chromosome
        # print("entered for loop")

        # To account for ChrM
        if not row_list[0][3].isalpha():
            if chr_no == int(row_list[0][3]):
                # extracting 5'UTR's start and end
                promoter_range_start = row_list[9][0]
                promoter_range_end = row_list[9][1]

                # print("**", row_list)
                # print("entered if")

                five_prime_range = []
                for nucleotide_number in range(promoter_range_start, promoter_range_end + 1):
                    five_prime_range.append(nucleotide_number)

                # if peak_first or peak_end in range(promoter_range_start, promoter_range_end):
                # if maxima_peak or peak_end or peak_first in five_prime_range:
                if (peak_first in five_prime_range) or (peak_end in five_prime_range):


                    # print(five_prime_range)
                    # print("peaks",maxima_peak,peak_first,peak_end)
                    # print("promoter", promoter_range_start,promoter_range_end)


                    promoter_seq_AGI = row_list[8].split('=')[1].strip("\n")
                    populate_csv(bZIP_agis[0], bZIP_agis[1], promoter_seq_AGI, final_list, column7,column9)



        # ChrM
        else:
            # print("entered M")
            if chr_no == (row_list[0][3]):
                promoter_range_start = row_list[9][0]
                promoter_range_end = row_list[9][1]
                # print("entered M if")

                five_prime_range = []
                for nucleotide_number in range(promoter_range_start, promoter_range_end + 1):
                    five_prime_range.append(nucleotide_number)

                if (peak_first in five_prime_range) or (peak_end in five_prime_range):
                    promoter_seq_AGI = row_list[8].split('=')[1].strip("\n")
                    populate_csv(bZIP_agis[0], bZIP_agis[1], promoter_seq_AGI, final_list, column7, column9)


# check_range(5,10,15)



# Extract AGI's of Two bZIP's
def get_bzip_agis(input_file: str) -> tuple[str,str]:

    # Example file path
    file_path = input_file
    # Use regex to find all occurrences of bZIP followed by numbers
    bZIPs_involved = re.findall(r'bZIP\d+', file_path)

    # Display the results
    # print("Extracted bZIP numbers:", bZIPs_involved)

    # Now find the bZIP agis
    AGI_file = open("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\bZIP_AGIS.txt", "r")
    for line in AGI_file:
        if str(bZIPs_involved[0]) in line:
            TF1 = line.split(':')[1].strip("\n")
            # print(TF1)

        if str(bZIPs_involved[1]) in line:
            TF2 = line.split(':')[1].strip("\n")
            # print(TF2)

    return (TF1,TF2)


# store = get_bzip_agis("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\GSE198873_DAPSeq-bZIP..bZIP_rr-ps-bZIP1..ph-bZIP10_Col..h-B-nuc1_GEM_events.narrowPeak")
# print(store)


# hence agis  = [[TF1,TF2, PS],[bzip1 AGI, bZIP2 AGI2, insert here],[bZIP AGI1, bZIPAGI 2],[]]


# Add date and create a CSV file
def populate_csv(tf1_agi: str, tf2_agi: str, promoter_seq_agi: str, agi_data: list, column7:float, column9:float):
    """
    Populate a CSV file, with the TF1,TF2 and the promoter sequence it binds to.\

    :return: a CSV file
    """
    # print("enterred")

    column_headings = [tf1_agi, tf2_agi, promoter_seq_agi, column7, column9]
    agi_data.append(column_headings)
    # print("yes", agi_data)

    with open('bZIP1_bZIP10_Parsed.csv', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(agi_data)

    # print("CSV file created!")


def get_nucleotide_numbers(narrowpeak_file:str):
    """
    Store the chromosome number, nucelotide at the start peak and end peak.
    """
    headings = [["bZIPI_AGI", "bZIPII_AGI", "PromoterSequenceAGI","Column7: EnrichmentVal", "Column9:Qvalue" ]]
    input = open(narrowpeak_file, "r")

    for line in input:
        # print('**' + line)
        string_stripped = line.strip("\n")
        store = string_stripped.split("\t")
        # print(store)

        chromosome_number = int(store[0])
        peak_first_nucleotide = int(store[1])
        peak_last_nucleotide = int(store[2])
        max_of_peak = int(store[3].split(':')[1])
        column7 = float(store[6])
        column9 = float(store[8])
        # print(max_of_peak)
        # print(type(max_of_peak))
        # break

    # Now find that in the other file:
        bZIPs_involved_AGIs = get_bzip_agis(narrowpeak_file)
        # print("done bZIPS")
        check_range(chromosome_number,peak_first_nucleotide,peak_last_nucleotide,bZIPs_involved_AGIs,max_of_peak, headings, column7, column9)



get_nucleotide_numbers("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\10_TRIAL_GSE198873_DAPSeq-bZIP..bZIP_rr-ps-bZIP11..ph-bZIP63_Col..h-B-nuc1_GEM_events.narrowPeak")
# get_nucleotide_numbers("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\TRIAL_GSE198873_DAPSeq-bZIP..bZIP_rr-ps-bZIP11..ph-bZIP63_Col..h-B-nuc1_GEM_events - Copy.narrowPeak")
# get_nucleotide_numbers("C:\\Users\\Tanaya\\OneDrive - University of Toronto\BCB330Y\\3000_bZIP53_bZIP9.narrowPeak")

# Checking +ve values from paper:
# 53 - 9
# get_nucleotide_numbers("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\peak_files_17_GEM\\GSE198873_DAPSeq-bZIP..bZIP_rr-ps-bZIP53..ph-bZIP9_Col..h-B-nuc1_GEM_events.narrowPeak")

# Now taking the 3000 values and running them;
get_nucleotide_numbers("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\3000_values\\3000_bZIP1_bZIP10.narrowPeak")
