# BCB330_PARSING_NARROW_PEAKS
- Repository of all files and code needed to parse NarrowPeak files from Li et al., 2023. 

Link to NarrowPeak files: https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE198873
AGI's for bZIPs obtained from: https://www.arabidopsis.org/


Notes regarding files:

File	Description
finalDump_2019-05-14.tsv.zip	Purified TSV file containing old migrated DB data, 'the truth' - curated by Eddi Esteban. Note the date of last update.
finalDumpDocumentation.txt	Accompanying documentation for each column in header row of TSV, from Eddi.
schema.sql	SQL schema for the new database, forward engineered from MYSQL workbench
package.json	JSON of necessary files needed to be installed, enter: npm i
insertIntoTables.js	Sole script file that will read TSV file above to make insertions into database node insertIntoTables.js
verifications.test.js	Unit tests to be ran after script INSERTions are completed. Run: npm run test see below to run tests individually
ints_DB_migration_jun_13_2019.sql.zip	MYSQL dump of the database (5.7). Note date of last update. If you need an updated copy, contact the BAR. ** UNINDEXED, RENAME AND CREATE YOUR OWN DB BEFORE IMPORTING! **
BAR_new_itrns_db.mwb	MYSQL Workbench file, namely an ERD that visualizes the relationships between the tables. Contains brief descriptions of each column.
itrns_db_idxes.sql	Suggested indexes to add to the database after importing.
