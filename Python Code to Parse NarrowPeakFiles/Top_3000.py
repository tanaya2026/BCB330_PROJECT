def extract_3000():

    # Input and Output Files defined:
    input = open("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\peak_files_17_GEM\\GSE198873_DAPSeq-bZIP..bZIP_rr-ps-bZIP11..ph-bZIP10_Col..h-B-nuc1_GEM_events.narrowPeak", "r")

    output = open("C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\3000_bZIP11_bZIP10.narrowPeak", "w")
    peaks_with_columns = []

    # Splitting columns in Narrow_Peak_File:
    for line in input:
        string_stripped = line.strip("\n")
        peaks_split = string_stripped.split("\t")
        peaks_with_columns.append(peaks_split)

    # Convert the qValue (column 9) to float for sorting and sort in descending order
    # sorted -> function used to sort list of lists
    # key: what part of lists do we want to sort, not entire list by x[8]
    # reverse = True; means sort in descending order.

    # Now including the enrichment of Column 7

    peaks_sorted = sorted(peaks_with_columns, key=lambda x: (float(x[8]), float(x[6])), reverse=True)

    # Select the top 3,000 peaks
    top_3000_peaks = peaks_sorted[:3000]

    # Write the top 3,000 peaks to the output file
    for row in top_3000_peaks:
        output.write('\t'.join(row) + '\n')

    # Checking if there are exactly 3000 peaks

    # print(type(top_3000_peaks))
    # print(len(top_3000_peaks))

    # output = open(
    #     "C:\\Users\\Tanaya\\OneDrive - University of Toronto\\BCB330Y\\top_3000_output.txt", "r")
    # number = 0
    # for line in output:
    #     number = number + 1
    # # print(number, "**")


extract_3000()
