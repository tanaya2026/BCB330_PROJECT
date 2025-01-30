# Chr1	TAIR10	five_prime_UTR	3631	3759	.	+	.	Parent=AT1G01010.1

# This strand is +ve hence must use +-1000 bps from start of nucelotide.


# i.e. 3631 - 1000 and 3631 + 1000


# Chr1	TAIR10	five_prime_UTR	8667	8737	.	-	.	Parent=AT1G01020.1

# This strand is -ve hence must use +-1000 bps from nucelotide end.

# 8737 - 1000 and 8737 + 1000


# replace those two columns with the values we want!
def insert_1000():
    five_prime_only_file = open("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\5' UTR_extracted.txt", "r")
    updated_column_file = open("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\5' UTR_extracted_+-1000.gff", "w")

    for line in five_prime_only_file:
        string_stripped = line.strip("\n")
        store = string_stripped.split("\t")

        if "+" in store:
            promoter_seq_start = int(store[3]) - 1000
            promoter_seq_end = int(store[3]) + 1000
            store[3] = str(promoter_seq_start)
            store[4] = str(promoter_seq_end)

            result = "\t".join(store)
            updated_column_file.write(str(result) + '\n')

        if "-" in line:
            promoter_seq_start = int(store[4]) - 1000
            promoter_seq_end = int(store[4]) + 1000
            store[3] = str(promoter_seq_start)
            store[4] = str(promoter_seq_end)

            result = "\t".join(store)
            updated_column_file.write(str(result) + '\n')


insert_1000()

# Have 34622 lines which is correct

# Testing top two lines
