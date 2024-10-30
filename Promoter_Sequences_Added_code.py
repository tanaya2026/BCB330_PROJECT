def insert_column():
    """
    Rewrites a TAIR file, with an additional column, containing a tuple, of the promoter start
    and end nucelotide numbers depending on their strand direction.
    If the 5' UTR is on the positive strand, then the promoter sequence is 1000 bp upstream.
    If the 5' UTR is on the negative strand, then the promoter sequence is 1000 bp downstream.

    """
    five_prime_only_file = open("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\5' UTR_extracted.txt", "r")
    updated_column_file = open("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\5' UTR_extracted_updated.txt", "w")

    # add the promoter start and end sites as a tuple, and create a new file with all the new columns
    # ['Chr1', 'TAIR10', 'five_prime_UTR', '3631', '3759', '.', '+', '.', 'Parent=AT1G01010.1', (ps,pe)]

    for line in five_prime_only_file:
        string_stripped = line.strip("\n")
        store = string_stripped.split("\t")

        if "+" in store:
            promoter_seq_start = int(store[3]) - 1000
            promoter_seq_end = int(store[3])
            new_tuple = (promoter_seq_start, promoter_seq_end)
            store.append(new_tuple)

            updated_column_file.write(str(store) + '\n')

        if "-" in line:
            promoter_seq_start = int(store[3])
            promoter_seq_end = int(store[3]) + 1000
            new_tuple = (promoter_seq_start, promoter_seq_end)
            store.append(new_tuple)

            updated_column_file.write(str(store) + '\n')


insert_column()


# 34621 entries of the new lines with additional columns, hence all lines have been updated
# Checking if it worked correctly:

# Line 10:
# In TAIR: Chr1	TAIR10	five_prime_UTR	37373	37398	.	-	.	Parent=AT1G01060.1
# In changed TAIR:['Chr1', 'TAIR10', 'five_prime_UTR', '37373', '37398', '.', '-', '.', 'Parent=AT1G01060.1', (37373, 38373)]

# Seems correct


# Line 10:
# In TAIR: Chr1	TAIR10	five_prime_UTR	23146	23518	.	+	.	Parent=AT1G01040.1
# In changed TAIR: ['Chr1', 'TAIR10', 'five_prime_UTR', '23146', '23518', '.', '+', '.', 'Parent=AT1G01040.1', (22146, 23146)]

# Seems correct
