# BCB330_PROJECT

**Incorporating novel PDIs and PPIs from the dDAP-seq technique in the AIV2/ePlant database will 
be beneficial to researchers in visualizing new connec ons, gaining insight and forming 
conclusions about the GRNs in Arabidopsis thaliana.**

Objectives: 
1.  Incorporating novel experimentally determined PPIs and PDIs from the dDAP-seq paper and 
popula ng the AIV2/ePlant database by: 
a. Parsing the NarrowPeak Files with reference to a GFF file to obtain genes involved in PDIs 
and PPIs in Arabidopsis thaliana with their AGI’s 
b. Uploading and Inserting data into mySQL database 
2. Proposed layout for visualization of dDAP-seq data 
3. Transition from a CGI script to a Flask-based BAR API web service

Methods: 
1.a. Parsing the NarrowPeak Files with reference to a GFF file to obtain genes involved in PDIs 
and PPIs in Arabidopsis thaliana with their AGI’s 

- Link to NarrowPeak files from Li et al., 2023.: https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE198873
- AGI's for bZIPs obtained from: https://www.arabidopsis.org/

File	Description:

| File  | Description |
| ------------- | ------------- |
| TAIR10_GFF3_genes.gff  | GFF file used to parse the NarrowPeak's|
| bZIP_AGIs  | bZIP's AGIs list|
| 5' UTR extracted | Contains only the 5'UTR information from the TAIR file |
| 5' UTR_extracted_code.py | Code to extract the 5'UTR information from the TAIR file |



