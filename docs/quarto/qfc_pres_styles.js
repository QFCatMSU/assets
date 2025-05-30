

document.addEventListener('DOMContentLoaded', function() 
{
    // Only run if we're in print-pdf mode
  if (window.location.search === "?print-pdf") {
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
    
    // create printer icon 
  	printLink = document.createElement('a');
  	printLink.classList.add("self");
  	printLink.target = "_self";
  	printLink.href = "#"
    printLink.addEventListener("click", function() 
    {
      const url = new URL(window.location.href);
      url.search = "?print-pdf"; // Trigger Reveal.js print mode
          window.open(url.toString(), "_blank");
      //window.location.href = url.toString(); // Reload with new query
    });
    printLink.style.marginLeft = "9px";
  	printLink.innerHTML = "&#9113";
  	
  	// stop Quarto from removing the primary header
  	// titleObj.classList.remove("d-none");
    
  	// add printer icon to title
  	subtitle.appendChild(printLink);
  }
})