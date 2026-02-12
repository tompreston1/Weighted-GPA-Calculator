document.getElementById("uploadForm").addEventListener("submit", async e => {
    e.preventDefault();
  
    const file = document.getElementById("file").files[0];
    if (!file) return;
  
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    let text = "";
  
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(i => i.str).join(" ") + "\n";
    }
  
  
    const courses = parseCourses(text);
  
    if (courses.length === 0) {
      document.getElementById("output").innerHTML =
        "<b>No valid courses found.</b>";
      return;
    }
  
    const wgpa = calculateWGPA(courses);
  
    document.getElementById("output").innerHTML = `
      <h2>WGPA: ${wgpa.toFixed(2)}</h2>
      <ul>
        ${courses.map(c =>
          `<li>${c.code} — Grade ${c.grade}, Units ${c.units}</li>`
        ).join("")}
      </ul>
    `;
  });
  
  /**
   * Parses UQ transcript rows like:
   * CSSE 1001 Software Engineering 2.00 2.00 4 8.000
   * COMP 3506 Algorithms ... 2.00 2.00 3S4 8.000
   */
  function parseCourses(text) {
    const courses = [];
  
    const courseRegex =
      /([A-Z]{4})\s+(\d{4})\s+.+?\s+2\.00\s+2\.00\s+([0-7](?:S\d)?)\s+\d+\.\d+/g;
  
    let match;
    while ((match = courseRegex.exec(text)) !== null) {
      const dept = match[1];
      const num = match[2];
      const gradeRaw = match[3];
  
      // Convert "3S4" → 4
      const grade = gradeRaw.includes("S")
        ? parseInt(gradeRaw.slice(-1))
        : parseInt(gradeRaw);
  
      courses.push({
        code: dept + num,
        grade,
        units: 2,
        yearWeight: yearWeight(num)
      });
    }
  
    return courses;
  }
  
  function yearWeight(courseNum) {
    const n = parseInt(courseNum);
    if (n >= 7000) return 5;
    if (n >= 6000) return 4;
    if (n >= 3000) return 3;
    if (n >= 2000) return 2;
    return 1;
  }
  
  function calculateWGPA(courses) {
    let numerator = 0;
    let denominator = 0;
  
    for (const c of courses) {
      numerator += c.grade * c.units * c.yearWeight;
      denominator += c.units * c.yearWeight;
    }
  
    return numerator / denominator;
  }
  