# Code to extract ONLY the 5' UTR lines from the TAIR_gff3 file

# input file: The TAIR_GFF3 file from which I will be extracting the 5' UTR lines from
input_file = "C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\TAIR10_GFF3_genes.gff"
# output file: The txt file which will contain the extracted 5' UTR lines
output_file = "C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\5' UTR_extracted.txt"

tair_file = open(input_file, "r")
new_file = open(output_file, "w")

# Looping through each line in TAIR; if 'five_prime_UTR' in line, adding line to txt.
for line in tair_file:
    if 'five_prime_UTR' in line:
        new_file.write(line)

# There are 34621 entries of five_prime_UTR and there are 34621 entries
# in the 5' UTR extracted as well!
