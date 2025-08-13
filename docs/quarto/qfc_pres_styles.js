document.addEventListener('DOMContentLoaded', function() 
{
  // Check for print-pdf mode
  if (window.location.search.match(/print-pdf/gi)) 
  {
    // Hide printer link
    const printLink = document.getElementById("printLink");
    if (printLink) printLink.style.display = "none";
    
    const params = new URLSearchParams(window.location.search);
    
    // If the is a filename, set that as the save name for the file 
    if (params.get("filename")) 
    {
      document.title = params.get("filename");
    }
  
    // when revealjs says the pdf is ready, bring up a print dialog
    window.addEventListener("load", () => {
      setTimeout(() => window.print(), 1000);
    });
    /*
    Reveal.addEventListener('pdf-ready', () => 
    {
      window.print(); 
    });*/

  }
  
  else
  {
    subtitle = document.querySelector("p.subtitle");
    title = document.querySelector("h1.title");
    
    if (subtitle)
      printText = subtitle.innerText;
    else if (title)
      printText = title.innerText;
    else
      printText = "quarto_doc"
    
    document.title = printText;
    
    // create printer icon 
  	printLink = document.createElement('a');
  	printLink.classList.add("self");
  	printLink.target = "_self";
  	printLink.href = "#"
  	printLink.id = "printLink"
  	printLink.addEventListener("click", function() 
    {
      const url = new URL(window.location.href);
      url.search = "?print-pdf"; // Trigger Reveal.js print mode
      url.searchParams.set("print-pdf", "1");
      url.searchParams.set("filename", printText);
      window.open(url.toString(), "_blank");
    });
    printLink.style.marginLeft = "9px";
  	printLink.innerHTML = "&#9113";
    
  	// add printer icon to the subtitle or the title (better to add in corner?)
  	if(subtitle)
  	  subtitle.appendChild(printLink);
  	else if (title)
  	  title.appendChild(printLink);
  }
})