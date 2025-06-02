document.addEventListener('DOMContentLoaded', function() 
{
  // Only run if we're in print-pdf mode
  if (window.location.search === "?print-pdf") {
    const params = new URLSearchParams(window.location.search);
      
    if (params.get("print-pdf") && params.get("filename")) 
    {
      document.title = params.get("filename");
    }
  
    window.addEventListener("load", () => {
      // Give the browser time to finish rendering
      setTimeout(() => {
        window.print();
      }, 1000); // 1 second is usually enough
    });
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