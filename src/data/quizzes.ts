export const SKILL_QUIZZES = {
  javascript: [
    { q: "What is the output of `typeof null` in JavaScript?", options: ["object", "null", "undefined", "number"], a: 0 },
    { q: "Which method is used to add an element to the end of an array?", options: ["push()", "pop()", "shift()", "unshift()"], a: 0 },
    { q: "What does `NaN` stand for?", options: ["Not a Number", "Null and Null", "No action Needed", "Negative and Negative"], a: 0 },
    { q: "Which keyword is used to declare a constant variable?", options: ["const", "let", "var", "constant"], a: 0 },
    { q: "What is the correct way to write a JavaScript array?", options: ["var colors = ['red', 'green', 'blue']", "var colors = (1:'red', 2:'green', 3:'blue')", "var colors = 'red', 'green', 'blue'", "var colors = 1 = ('red'), 2 = ('green'), 3 = ('blue')"], a: 0 },
    { q: "How do you find the number with the highest value of x and y?", options: ["Math.max(x, y)", "Math.ceil(x, y)", "top(x, y)", "ceil(x, y)"], a: 0 },
    { q: "Which event occurs when the user clicks on an HTML element?", options: ["onclick", "onchange", "onmouseclick", "onmouseover"], a: 0 },
    { q: "How do you declare a JavaScript variable?", options: ["var carName;", "variable carName;", "v carName;", "carName var;"], a: 0 },
    { q: "What will `console.log(1 + '1')` output?", options: ["11", "2", "undefined", "NaN"], a: 0 },
    { q: "Which operator is used to assign a value to a variable?", options: ["=", "*", "-", "x"], a: 0 }
  ],
  sql: [
    { q: "Which SQL statement is used to extract data from a database?", options: ["SELECT", "GET", "OPEN", "EXTRACT"], a: 0 },
    { q: "Which SQL statement is used to update data in a database?", options: ["UPDATE", "SAVE", "MODIFY", "SAVE AS"], a: 0 },
    { q: "Which SQL statement is used to delete data from a database?", options: ["DELETE", "REMOVE", "COLLAPSE", "CLEAR"], a: 0 },
    { q: "Which SQL statement is used to insert new data in a database?", options: ["INSERT INTO", "ADD RECORD", "ADD NEW", "INSERT NEW"], a: 0 },
    { q: "With SQL, how do you select a column named 'FirstName' from a table named 'Persons'?", options: ["SELECT FirstName FROM Persons", "EXTRACT FirstName FROM Persons", "SELECT Persons.FirstName", "GET FirstName FROM Persons"], a: 0 },
    { q: "With SQL, how do you select all the columns from a table named 'Persons'?", options: ["SELECT * FROM Persons", "SELECT Persons", "SELECT *.Persons", "SELECT [all] FROM Persons"], a: 0 },
    { q: "With SQL, how do you select all the records from a table named 'Persons' where the value of the column 'FirstName' is 'Peter'?", options: ["SELECT * FROM Persons WHERE FirstName='Peter'", "SELECT * FROM Persons WHERE FirstName<>'Peter'", "SELECT [all] FROM Persons WHERE FirstName LIKE 'Peter'", "SELECT [all] FROM Persons WHERE FirstName='Peter'"], a: 0 },
    { q: "With SQL, how do you select all the records from a table named 'Persons' where the value of the column 'FirstName' starts with an 'a'?", options: ["SELECT * FROM Persons WHERE FirstName LIKE 'a%'", "SELECT * FROM Persons WHERE FirstName LIKE '%a'", "SELECT * FROM Persons WHERE FirstName='a'", "SELECT * FROM Persons WHERE FirstName='%a%'"], a: 0 },
    { q: "The OR operator displays a record if ANY conditions listed are true. The AND operator displays a record if ALL of the conditions listed are true", options: ["True", "False", "Sometimes", "Never"], a: 0 },
    { q: "With SQL, how do you select all the records from a table named 'Persons' where the 'FirstName' is 'Peter' and 'LastName' is 'Jackson'?", options: ["SELECT * FROM Persons WHERE FirstName='Peter' AND LastName='Jackson'", "SELECT * FROM Persons WHERE FirstName='Peter' OR LastName='Jackson'", "SELECT FirstName='Peter', LastName='Jackson' FROM Persons", "SELECT * FROM Persons WHERE FirstName<>'Peter' AND LastName<>'Jackson'"], a: 0 }
  ],
  html: [
    { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language", "Hyper Tool Markup Language"], a: 0 },
    { q: "Who is making the Web standards?", options: ["The World Wide Web Consortium", "Mozilla", "Google", "Microsoft"], a: 0 },
    { q: "Choose the correct HTML element for the largest heading:", options: ["<h1>", "<heading>", "<h6>", "<head>"], a: 0 },
    { q: "What is the correct HTML element for inserting a line break?", options: ["<br>", "<break>", "<lb>", "<newline>"], a: 0 },
    { q: "What is the correct HTML for adding a background color?", options: ["<body style='background-color:yellow;'>", "<background>yellow</background>", "<body bg='yellow'>", "<body color='yellow'>"], a: 0 },
    { q: "Choose the correct HTML element to define important text", options: ["<strong>", "<b>", "<important>", "<i>"], a: 0 },
    { q: "Choose the correct HTML element to define emphasized text", options: ["<em>", "<i>", "<italic>", "<strong>"], a: 0 },
    { q: "What is the correct HTML for creating a hyperlink?", options: ["<a href='http://www.w3schools.com'>W3Schools</a>", "<a name='http://www.w3schools.com'>W3Schools.com</a>", "<a url='http://www.w3schools.com'>W3Schools.com</a>", "<a>http://www.w3schools.com</a>"], a: 0 },
    { q: "Which character is used to indicate an end tag?", options: ["/", "*", "<", "^"], a: 0 },
    { q: "How can you open a link in a new tab/browser window?", options: ["<a href='url' target='_blank'>", "<a href='url' target='new'>", "<a href='url' new>", "<a href='url' target='_new'>"], a: 0 }
  ],
  css: [
    { q: "What does CSS stand for?", options: ["Cascading Style Sheets", "Colorful Style Sheets", "Computer Style Sheets", "Creative Style Sheets"], a: 0 },
    { q: "What is the correct HTML for referring to an external style sheet?", options: ["<link rel='stylesheet' type='text/css' href='mystyle.css'>", "<style src='mystyle.css'>", "<stylesheet>mystyle.css</stylesheet>", "<link href='mystyle.css'>"], a: 0 },
    { q: "Where in an HTML document is the correct place to refer to an external style sheet?", options: ["In the <head> section", "In the <body> section", "At the end of the document", "Before the <html> tag"], a: 0 },
    { q: "Which HTML tag is used to define an internal style sheet?", options: ["<style>", "<script>", "<css>", "<link>"], a: 0 },
    { q: "Which HTML attribute is used to define inline styles?", options: ["style", "class", "font", "styles"], a: 0 },
    { q: "Which is the correct CSS syntax?", options: ["body {color: black;}", "{body:color=black;}", "body:color=black;", "{body;color:black;}"], a: 0 },
    { q: "How do you insert a comment in a CSS file?", options: ["/* this is a comment */", "// this is a comment", "// this is a comment //", "' this is a comment"], a: 0 },
    { q: "Which property is used to change the background color?", options: ["background-color", "color", "bgcolor", "bg-color"], a: 0 },
    { q: "How do you add a background color for all <h1> elements?", options: ["h1 {background-color:#FFFFFF;}", "h1.all {background-color:#FFFFFF;}", "all.h1 {background-color:#FFFFFF;}", "h1 {bgcolor:#FFFFFF;}"], a: 0 },
    { q: "Which CSS property is used to change the text color of an element?", options: ["color", "text-color", "fgcolor", "font-color"], a: 0 }
  ],
  python: [
    { q: "What is the correct syntax to output 'Hello World' in Python?", options: ["print('Hello World')", "p('Hello World')", "echo('Hello World')", "console.log('Hello World')"], a: 0 },
    { q: "How do you insert comments in Python code?", options: ["#This is a comment", "//This is a comment", "/*This is a comment*/", "<!--This is a comment-->"], a: 0 },
    { q: "Which one is NOT a legal variable name?", options: ["my-var", "my_var", "_myvar", "myvar"], a: 0 },
    { q: "How do you create a variable with the numeric value 5?", options: ["x = 5", "x = int(5)", "Both are correct", "int x = 5"], a: 2 },
    { q: "What is the correct file extension for Python files?", options: [".py", ".pt", ".pyt", ".python"], a: 0 },
    { q: "How do you create a variable with the floating number 2.8?", options: ["x = 2.8", "x = float(2.8)", "Both are correct", "float x = 2.8"], a: 2 },
    { q: "What is the correct syntax to output the type of a variable or object in Python?", options: ["print(type(x))", "print(typeof(x))", "print(typeof x)", "print(typeOf(x))"], a: 0 },
    { q: "What is the correct way to create a function in Python?", options: ["def myFunction():", "create myFunction():", "function myfunction():", "def myFunction:"], a: 0 },
    { q: "In Python, 'Hello', is the same as \"Hello\"", options: ["True", "False", "Sometimes", "Never"], a: 0 },
    { q: "What is a correct syntax to return the first character in a string?", options: ["x = 'Hello'[0]", "x = 'Hello'.sub(0, 1)", "x = sub('Hello', 0, 1)", "x = 'Hello'[1]"], a: 0 }
  ],
  kubernetes: [
    { q: "What is Kubernetes?", options: ["A container orchestration platform", "A programming language", "A database management system", "A web browser"], a: 0 },
    { q: "What is a Pod in Kubernetes?", options: ["The smallest deployable unit", "A cluster of nodes", "A persistent storage volume", "A network policy"], a: 0 },
    { q: "Which component is the control plane's front end?", options: ["kube-apiserver", "kube-scheduler", "kube-controller-manager", "etcd"], a: 0 },
    { q: "What is used to store cluster state in Kubernetes?", options: ["etcd", "MySQL", "Redis", "MongoDB"], a: 0 },
    { q: "Which component runs on every node and ensures containers are running in a Pod?", options: ["kubelet", "kube-proxy", "container runtime", "kube-scheduler"], a: 0 },
    { q: "What is a ReplicaSet?", options: ["Ensures a specified number of pod replicas are running", "Manages network traffic", "Stores secrets", "Defines a service"], a: 0 },
    { q: "What is a Deployment in Kubernetes?", options: ["Provides declarative updates for Pods and ReplicaSets", "A single instance of a container", "A physical server", "A load balancer"], a: 0 },
    { q: "How do you expose a Pod to external network traffic?", options: ["Using a Service", "Using a ConfigMap", "Using a Secret", "Using a Volume"], a: 0 },
    { q: "What is a ConfigMap used for?", options: ["Storing non-confidential data in key-value pairs", "Storing passwords", "Managing network policies", "Scheduling pods"], a: 0 },
    { q: "What is the command-line tool for interacting with a Kubernetes cluster?", options: ["kubectl", "k8s-cli", "kube-cmd", "kubernetes-cli"], a: 0 }
  ],
  dotnet: [
    { q: "What does CLR stand for in .NET?", options: ["Common Language Runtime", "Common Language Resource", "C Language Runtime", "Common Logic Runtime"], a: 0 },
    { q: "Which language is primarily used with .NET?", options: ["C#", "Java", "Python", "Ruby"], a: 0 },
    { q: "What is the base class for all classes in .NET?", options: ["System.Object", "System.Base", "System.Root", "System.Class"], a: 0 },
    { q: "What is a namespace in .NET?", options: ["A way to organize code and prevent naming conflicts", "A type of variable", "A memory management system", "A database connection string"], a: 0 },
    { q: "What is the difference between value types and reference types?", options: ["Value types store data directly, reference types store a reference to the data", "Value types are faster, reference types are slower", "Value types are used for numbers, reference types are used for strings", "There is no difference"], a: 0 },
    { q: "What is garbage collection in .NET?", options: ["Automatic memory management", "A way to delete files", "A process for cleaning up code", "A database maintenance task"], a: 0 },
    { q: "What is an interface in C#?", options: ["A contract that defines a set of methods and properties", "A class that cannot be instantiated", "A type of variable", "A user interface element"], a: 0 },
    { q: "What is the purpose of the 'using' statement in C#?", options: ["To ensure that unmanaged resources are disposed of properly", "To import a namespace", "To declare a variable", "To create a loop"], a: 0 },
    { q: "What is LINQ?", options: ["Language Integrated Query", "List Integrated Query", "Language Internal Query", "Logic Integrated Query"], a: 0 },
    { q: "What is ASP.NET Core?", options: ["A cross-platform framework for building web apps", "A database management system", "A programming language", "A cloud hosting provider"], a: 0 }
  ],
  machinelearning: [
    { q: "What is Machine Learning?", options: ["A subset of AI that allows systems to learn from data", "A type of hardware", "A programming language", "A database management system"], a: 0 },
    { q: "What is supervised learning?", options: ["Learning from labeled data", "Learning from unlabeled data", "Learning through trial and error", "Learning without data"], a: 0 },
    { q: "What is unsupervised learning?", options: ["Learning from unlabeled data", "Learning from labeled data", "Learning through trial and error", "Learning with a teacher"], a: 0 },
    { q: "What is reinforcement learning?", options: ["Learning through trial and error to maximize a reward", "Learning from labeled data", "Learning from unlabeled data", "Learning by memorization"], a: 0 },
    { q: "What is overfitting?", options: ["When a model learns the training data too well and performs poorly on new data", "When a model is too simple to capture the underlying pattern", "When a model is trained too quickly", "When a model uses too much memory"], a: 0 },
    { q: "What is underfitting?", options: ["When a model is too simple to capture the underlying pattern", "When a model learns the training data too well", "When a model is trained too slowly", "When a model uses too little memory"], a: 0 },
    { q: "What is cross-validation?", options: ["A technique to evaluate a model's performance on unseen data", "A way to combine multiple models", "A method for cleaning data", "A type of neural network"], a: 0 },
    { q: "What is a neural network?", options: ["A computing system inspired by the human brain", "A type of database", "A programming language", "A hardware component"], a: 0 },
    { q: "What is deep learning?", options: ["A subset of ML based on artificial neural networks with multiple layers", "A type of shallow learning", "A method for data visualization", "A statistical technique"], a: 0 },
    { q: "Which library is commonly used for ML in Python?", options: ["scikit-learn", "React", "Express", "Django"], a: 0 }
  ],
  dataanalyst: [
    { q: "What is the primary role of a Data Analyst?", options: ["To interpret data and turn it into information", "To build web applications", "To configure servers", "To design user interfaces"], a: 0 },
    { q: "Which tool is commonly used for data visualization?", options: ["Tableau", "Photoshop", "Visual Studio", "Docker"], a: 0 },
    { q: "What does ETL stand for?", options: ["Extract, Transform, Load", "Execute, Test, Loop", "Evaluate, Train, Learn", "Export, Transfer, Link"], a: 0 }
  ],
  devops: [
    { q: "What is the main goal of DevOps?", options: ["To shorten the system development life cycle", "To write more code", "To design better UIs", "To manage databases"], a: 0 },
    { q: "Which tool is used for continuous integration?", options: ["Jenkins", "Photoshop", "Excel", "Word"], a: 0 },
    { q: "What is Infrastructure as Code (IaC)?", options: ["Managing infrastructure through code", "Writing code for infrastructure", "A programming language", "A database"], a: 0 }
  ],
  systemdesign: [
    { q: "What is a load balancer?", options: ["A device that distributes network traffic across multiple servers", "A database", "A programming language", "A web browser"], a: 0 },
    { q: "What is caching used for?", options: ["To store copies of files for faster access", "To delete files", "To encrypt data", "To compile code"], a: 0 },
    { q: "What is horizontal scaling?", options: ["Adding more machines to your pool of resources", "Adding more power to an existing machine", "Reducing the number of machines", "Changing the database schema"], a: 0 }
  ],
  ai: [
    { q: "What does AI stand for?", options: ["Artificial Intelligence", "Automated Information", "Advanced Integration", "Artificial Integration"], a: 0 },
    { q: "What is a neural network?", options: ["A computing system inspired by the human brain", "A type of database", "A programming language", "A hardware component"], a: 0 },
    { q: "What is Natural Language Processing (NLP)?", options: ["The ability of a computer to understand human language", "A way to compile code", "A database query language", "A network protocol"], a: 0 }
  ]
};
