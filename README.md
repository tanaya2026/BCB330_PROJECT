# BCB330_PROJECT: Developing a gene regulatory network of Arabidopsis thaliana

**Incorporating novel PDIs and PPIs from the dDAP-seq technique in the AIV2/ePlant database will 
be beneficial to researchers in visualizing new connections, gaining insight and forming 
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
- TAIR file obtained from: https://www.arabidopsis.org/download/list?dir=Genes

File	Description:

| File  | Description |
| ------------- | ------------- |
| NarrowPeakFiles  | NarrowPeak files from dDAP-seq paper, Li et al., 2023|
| Python Code to Parse NarrowPeakFiles | Python Code to Parse NarrowPeakFiles from Li et al., 2023 using TAIR_GFF|
| R Code to Parse NarrowPeak Files | R Code to Parse NarrowPeak Files from Li et al., 2023 using TAIR_GFF |
| Top_3000_peaks | The Top 3000 peaks from each NarrowPeak file, based on decreasing fold enrichment value and decreasing q value|
| bZIP_AGIs.txt  | AGI's of bZIP's in Li et al., 2023|







