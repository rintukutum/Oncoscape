#!/bin/bash
# run with . ./setupLocalR.sh to prevent forking a subshell
Rscript installBioconductorPackages.R



cd dataPackages
R --vanilla CMD INSTALL --no-test-load --no-lock PatientHistory
R --vanilla CMD INSTALL --no-test-load --no-lock SttrDataPackage
R --vanilla CMD INSTALL --no-test-load --no-lock DEMOdz
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAgbm
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlgg
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrain
R --vanilla CMD INSTALL --no-test-load --no-lock DGI
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrca
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAprad
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlusc
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAluad
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlung
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAhnsc
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAcoad
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAread
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAcoadread
R --vanilla CMD INSTALL --no-test-load --no-lock TCGApaad
R --vanilla CMD INSTALL --no-test-load --no-lock NetworkMaker

cd ../analysisPackages
<<<<<<< HEAD:r_modules/installRpackages_global.sh
R --vanilla CMD INSTALL --no-test-load --no-lock PCA
R --vanilla CMD INSTALL --no-test-load --no-lock PLSR

cd ../RInside
R --vanilla CMD INSTALL --no-test-load --no-lock .

=======
R  --vanilla CMD INSTALL --no-test-load --no-lock PCA
R  --vanilla CMD INSTALL --no-test-load --no-lock PLSR
 
>>>>>>> ae59845bfcccb430e4981f1a0e7f84fd035a3def:installRpackages_global.sh
cd ../Oncoscape
R  --vanilla CMD INSTALL --no-test-load --no-lock .

