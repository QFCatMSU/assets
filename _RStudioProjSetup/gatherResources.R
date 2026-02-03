rm(list=ls());   

# read in the qmd file as text
txt <- readLines("_RStudioProjSetup/part1.qmd")

# collapse into one string
doc <- paste(txt, collapse = "\n")

#### Quarto will always put link in parentheses and it comes after a breacket:
#  [link text](path/to/file/filename.ext)

# regex to capture file references
# \\( and \\) → match literal parentheses.
# ^)  not a parenthesis
# [^)]+ → match anything inside until the next ).
# \\.[A-Za-z0-9]+ → require a file extension.
# Whole match is captured in group 1.
pattern <- "\\]\\(([^)]+\\.[A-Za-z0-9]+)\\)"
#pattern <- "\\(((?!https?://)[^)]+\\.[A-Za-z0-9]+)\\)"


### This gives the start location of the pattern (as an integer)
#    and the length of the example (as the attribute match.length)
n = gregexpr(pattern, doc, perl = FALSE)
print(attr(n[[1]], "match.length"))
print(n)
# extract
m <- regmatches(doc, n)
files <- unlist(m)

# strip the end bracket and the parentheses
files <- gsub("^\\]\\(|\\)$", "", files)

### could remove http:// or https:// here -- but file.exists() does take care of this

local_files <- files[file.exists(files)]

print(local_files)

#print(files2)
