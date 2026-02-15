# Define file paths
url <- "https://raw.githubusercontent.com/QFCatMSU/assets/refs/heads/main/quarto/css-dark.css"

# Base Positron extensions directory (works for any Windows user)
base_dir <- file.path(Sys.getenv("USERPROFILE"),
                      ".positron", "extensions")

# Find the installed Quarto extension directory
quarto_dir <- list.dirs(base_dir,
                        recursive = FALSE,
                        full.names = TRUE)

quarto_dir <- quarto_dir[
  grepl("^quarto\\.quarto-", basename(quarto_dir))
]

quarto_dir = quarto_dir[length(quarto_dir)]

target_file = paste0(quarto_dir, "/assets/www/editor/style.css")

# Read contents
text_prepend <- readLines(url, warn = FALSE)
text_target  <- readLines(target_file, warn = FALSE)

# Combine (prepend first file to beginning of second)
combined_text <- c(text_prepend, text_target)

# Write back to target file
writeLines(combined_text, target_file)
