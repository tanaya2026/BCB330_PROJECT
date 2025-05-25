# BCB330: Developing a gene regulatory network of Arabidopsis thaliana

Recent work by Li et al., introduced a novel technique called double DNA Affinity Purification
sequencing (dDAP-seq). dDAP-seq focuses on the dimerization (homodimerization and 
heterodimerization) of basic leucine zipper (bZIP) transcription factors. These dimers play crucial roles 
in plant development and response to stress, mainly by controlling gene expression and regulation (Li et 
al., 2023). The dDAP-seq assay introduced in the paper is an extension of the DAP-seq technique, 
focusing on mapping the binding sites of the bZIPs to DNA. 

Applying the dDAP-seq technique to identify PDIs in Arabidopsis revealed that when bZIP TFs 
heterodimerize, they expand the possible DNA binding sites the dimer can bind to, which in turn means 
that they control more genes, when compared to homodimers. The authors were able to find the roles of 
certain bZIP factors in Arabidopsis thaliana and identify novel PPIs and PDIs (Li et al., 2023).  
A collection of these transcription factors and their interactions with specific DNA sequences in 
Arabidopsis thaliana forms a GRN or gene regulatory network. This network plays crucial roles in 
understanding gene regulation, particularly how TFs and their target genes can regulate other genes 
(Kulkarni et al., 2018).  

The Bio-Analytic Resource for Plant Biology (BAR) hosts many different web-based tools, but here we 
focus particularly on Arabidopsis Interactions Viewer 2 (AIV2) and ePlant. AIV2 and ePlant, are 
excellent tools for studying GRNs, PPIs and PDIs in Arabidopsis thaliana. AIV2 currently hosts around 
2.8 million PPis and PDIS (Dong et al., 2019). ePlant hosts a total of 140,353 PPIs and 3 million PDIs 
(Waese et al., 2017).  

With new techniques like dDAP-seq emerging, there exists a need to integrate these novel interactions in 
the databases of AIV2 and ePlant for enhancing our knowledge about the GRN’s of Arabidopsis 
thaliana. In this project, we work on integrating these new PPIs and PDIs obtained from the double 
DAP-seq paper into AIV2/ePlants database. 

# Hypothesis 
Incorporating novel PDIs and PPIs from the dDAP-seq technique in the AIV2/ePlant database will be 
beneficial to researchers in visualizing new connections, gaining insight and forming conclusions about 
the GRNs in Arabidopsis thaliana. 

# Objectives 
This includes: 
1. Incorporating novel experimentally determined PPIs and PDIs from the dDAP-seq paper and 
populating the AIV2/ePlant database by parsing the narrowPeak files with reference to a 
TAIR10_gff3 file to obtain genes involved in PDIs and PPIs in Arabidopsis thaliana with their AGI’s.  
2. Design and implement the user interface(UI)  for the visualisation of dDAP-seq data.  

# Languages Used:
1. Python
2. R
3. JavaScript

# Methods: 
1. Parsing the narrowPeak Files with reference to a GFF file to obtain regulatory elements involved in PDIs 
and PPIs in Arabidopsis thaliana with their corresponding AGI’s 

- Link to narrowPeak files from Li et al., 2023.: https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE198873
- AGI's for bZIPs obtained from: https://www.arabidopsis.org/
- TAIR10_gff3 file obtained from: https://www.arabidopsis.org/download/list?dir=Genes
- Link to Li et al., 2023's paper: https://pubmed.ncbi.nlm.nih.gov/37147307/

| Folder | Description |
| ------------- | ------------- |
| Python Code to Parse NarrowPeakFiles| Python code to parse the narrowPeak files from Li et al., 2023 |
| R Code to Parse NarrowPeak Files | R code to parse the narrowPeak files from Li et al., 2023 |
| Top_3000_peaks | Top 3000 peaks per narrowPeak file ranked by decreasing -log10(qvalue) and by decreasing fold enrolment value|
| NarrowPeakFiles| narrowPeak files obtained from Li et al., 2023 |

| File  | Description |
| ------------- | ------------- |
| 5'UTR_+-1000.py | Code to extract the promoter element from the narrowPeak files |
| 5'UTR_extract.py| Code to extract the 5' UTR sequences from the TAIR10_gff3 file |
| main_agi_extraction.py |  Core parsing algorithm to parse narrowPeakFiles from Li et al., 2023 using TAIR10_gff3|
| insert_promoter.py| Code to insert an extra column containing the promoter range into TAIR10_gff3|
| Top_3000.py | Code to extract top 3000 peaks per narrowPeak file |
| bZIP_AGIs.txt  | AGI's of bZIP's involved in Li et al., 2023|
| main_promoter.rmd | R Code to extract the Promoter element from the narrowPeak files|

# R Libraries used: 
ChIPseeker,
GenomicRanges,
rtracklayer,
TxDb.Athaliana.BioMart.plantsmart51,
org.At.tair.db,
GenomicFeatures.


2. Design and Implementation of a User Interface for dDAP-seq Data Visualization 

- Link to sample dDAP data JSON file:https://bar.utoronto.ca/~nprovart/sample-double-bzip.json
- Link to AIV2 code repository: https://github.com/VinLau/AIV-v2-cytoscapeJS/tree/master
- Link to BAR API: https://bar.utoronto.ca/api/gene_information/single_gene_query/arabidopsis/AT5G28770

| File  | Description |
| ------------- | ------------- |
| aiv.js | Code to run AIV2 with dDAP-seq data implementation, and to visualize dDAP-seq determined PDI table|








