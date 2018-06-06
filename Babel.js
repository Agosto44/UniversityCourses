/*

Babel.js - AMD/2018

Autores: Pedro Agostinho (50203), Pedro Almeida (50490)

Comentario sobre o trabalho:
Efetuamos todas as partes do trabalho, tendo em conta os objetivos 
e requisitos predefinidos.

Observacao: na implementacao do Symbols baralhamos os blocos que o
utilizador pode usar, de modo a que a ordem dos blocos fosse diferente 
da ordem das respostas

Para que o programa coubesse, na sua maioria, em 80 colunas,
foi feito CTRL-TABx3, sacrificando uma indentacao optima.

01234567890123456789012345678901234567890123456789012345678901234567890123456789

*/

/* Global variables */

var xmlDoc, xmlSerializer, languageName, language;


class OnStartUp{

static runLanguage(text) {
xmlDoc = XMLFunctions.text2XML(text);  
xmlSerializer = new XMLSerializer();  

var nodes = xmlDoc.getElementsByTagName("LANGNAME");
var classType = xmlDoc.getElementsByTagName("CLASS");

if( nodes.length == 1 && classType.length == 1) {
languageName = nodes[0].childNodes[0].nodeValue; 

if(classType[0].childNodes[0].nodeValue == "Language") {
    language = new Language();
    language.loadHomeScreen();
    language.launchHomeScreen();
}
else if(classType[0].childNodes[0].nodeValue == "LanguageExtraAlphabets"){
    language = new LanguageExtraAlphabets();
    language.loadHomeScreen();
    language.launchHomeScreen();
}
}
else{
alert('ERROR: Not a language file!\nPLEASE, TRY AGAIN!');
OnStartUp.fileInputScreen();
}
}

static processLocalFile(e, processor) {
var file = e.target.files[0];
if (!file) {
return;
}
var reader = new FileReader();
reader.onload = function(e) {
processor(e.target.result);
};
reader.readAsText(file, "UTF-8");
}

static fileInputScreen(){
var body = document.body;
body.innerHTML = '';

var d = HTMLHandler.p(body, "display:table; margin:auto; margin-top:200px;")

var f = HTMLHandler.inpuFile(d, "file-input");
HTMLHandler.eventHandler(f, "onchange", "OnStartUp.processLocalFile(event, OnStartUp.runLanguage);");
}
}

class MiscFunctions{

static play(sound) {
const soundEnabled = true;
const prefix = "http://ctp.di.fct.unl.pt/miei/lap/projs/proj2018-3/files/resources/sounds/";
if( soundEnabled )
new Audio(prefix + sound).play();
else
alert("SOUND: " + sound);
}


static validateAnswer(answer, translations){

for(var i = 0; i < translations.length; i++){

if( answer == translations[i] ){
    MiscFunctions.play("general/right_answer.mp3");
    return;
}

}

MiscFunctions.play("general/wrong_answer.mp3");

}
}

class XMLFunctions{

static text2XML(text) {
var parser = new DOMParser();
var serializer = new XMLSerializer();
xmlDoc = parser.parseFromString(text,"text/xml");
return xmlDoc;
}

static XML2Text(xml) {
return xmlSerializer.serializeToString(xml);
}
}

class HTMLHandler{

static eventHandler(a, kind, action) {
a[kind] = new Function(action);
return a;
}

static eventHandler2(a, kind, action) {
a[kind] = action;
return a;
}

static h1(target, text) {
var a = document.createElement("H1");
var b = document.createTextNode(text);
a.appendChild(b);
target.appendChild(a);
return a;
}

static hr(target) {
var a = document.createElement("HR");
target.appendChild(a);
return a;
}

static p(target, style) {
var a = document.createElement("P");
a.style = style;
target.appendChild(a);
return a;
}

static br(target) {
var a = document.createElement("BR");
target.appendChild(a);
return a;
}

static text(target, fsize, t) {
var a = document.createElement('SPAN');
var b = document.createTextNode(t);
a.appendChild(b);
a.style.fontSize = fsize + "px";
target.appendChild(a);
return a;
}

static img(target, url) {
var a = document.createElement("IMG");
a.src = url;
target.appendChild(a);
return a;
}

static inputActiveText(target, id, size, fsize, placeholder) {
var a = document.createElement("INPUT");
a.type = "text";
a.id = id;
a.value = "";
a.placeholder = placeholder;
a.style.fontSize = fsize + "px";
a.size = size;
target.appendChild(a);
return a;
}    

static inpuButton(target, id, value, color) {
var a = document.createElement("INPUT");
a.type = "button";
a.id = id;
a.value = value;
a.style.backgroundColor = color;
target.appendChild(a);
return a;
}

static inpuFile(target, id, ) {
var a = document.createElement("INPUT");
a.type = "file";
a.id = id;
target.appendChild(a);
return a;
}

static div(target, style) {
var a = document.createElement("DIV");
a.style = style;
target.appendChild(a);
return a;    
}
}

class Language {

constructor(){
this.lessons = [];
this.currentLesson;
this.currentScreen;
this.homeScreen;
}

loadHomeScreen(){

var lessonsXML = xmlDoc.getElementsByTagName("LESSON");

for(var i = 0; i < lessonsXML.length; i++){
this.lessons[i] = new Lesson(lessonsXML[i]);
}

this.homeScreen = new HomeScreen(this.lessons);
}

launchHomeScreen(){
this.currentScreen = this.homeScreen;
this.homeScreen.displayScreen();
}

launchLessonCompleteScreen(){
this.currentLesson.lessonCompleteScreen();
}

runLesson(i){
this.currentLesson = this.lessons[i];
this.lessons[i].displayNextScreen();
}

getCurrentLesson(){
return this.currentLesson;
}
}

class LanguageExtraAlphabets extends Language{
constructor(){
super();
this.symbols = [];
}
loadHomeScreen(){
super.loadHomeScreen();
var SymbolsXML = xmlDoc.getElementsByTagName("SYMBOLS");

for(var i = 0; i < SymbolsXML.length; i++){
this.symbols[i] = new Symbols(SymbolsXML[i]);
}

this.homeScreen.loadSymbols(this.symbols);
}

runSymbols(i){
if(this.symbols.length > 0){
this.currentScreen = this.symbols[i];
this.currentScreen.displayScreen();
}
}

displayNextSymbols(){
if(!(this.currentScreen instanceof Symbols))
alert("Something went wrong");
var id = this.currentScreen.id;
if(this.symbols.length > id){
this.currentScreen = this.symbols[id];
this.currentScreen.displayScreen();
}
}
}

class Lesson{

constructor(lesson){
this.lesson = lesson;
this.id = this.lesson.getAttribute('ID');
this.screens = [];
this.readScreens();
this.displayedScreens = 0;
this.lessonCompleteScr;
this.incorrectIndex = 0;
}

readScreens(){

for(var i = 0; i < this.lesson.childNodes.length; i++){
var ch = this.lesson.childNodes[i];

switch(ch.nodeName){
    case "KEYBOARD":
        this.screens.push(new Keyboard(ch));
        break;
    case "PAIRS":
        this.screens.push(new Pairs(ch));
        break;
    case "BLOCKS":
        this.screens.push(new Blocks(ch));
        break;
    default:
        break;

}
}

}

displayNextScreen(){

if(this.hasIncorrectScreens()){

for(var i = this.incorrectIndex; i < this.screens.length; i++){

    if(!this.screens[i].isCorrect){
        this.incorrectIndex = i + 1;
        language.currentScreen = this.screens[i];
        this.screens[i].displayScreen();
        return;
    }

}

this.incorrectIndex = 0;

for(var i = this.incorrectIndex; i < this.screens.length; i++){

    if(!this.screens[i].isCorrect){
        this.incorrectIndex = i + 1;
        this.screens[i].displayScreen();
        return;
    }

}

}
else{
language.launchLessonCompleteScreen();
}
}


hasIncorrectScreens(){
return this.getIncorrectScreens() > 0;
}

getIncorrectScreens(){

var counter = 0;
for(var i = 0; i < this.screens.length; i++)
if(!this.screens[i].isCorrect)
    counter++;

return counter;
}

lessonCompleteScreen(){
if(this.lessonCompleteScr === undefined)
this.lessonCompleteScr = new LessonCompleteScreen(this.id);
language.currentScreen = this.lessonCompleteScr;
this.lessonCompleteScr.displayScreen();
}
}

class Screen{

constructor(){
}

loadValues(){
}

displayScreen(){
this.body = document.body;
this.body.innerHTML = '';

var bottomLeft = HTMLHandler.div(this.body, "display:table; position:fixed; bottom:0;");
var hdr = HTMLHandler.div(this.body, "display:table; margin:auto; margin-top:20px");

HTMLHandler.h1(hdr, "Babel  -  " + languageName + "");

HTMLHandler.hr(this.body);

var i = HTMLHandler.img(bottomLeft, "http://icons.iconarchive.com/icons/praveen/minimal-outline/128/back-icon.png");
if(language.currentScreen instanceof HomeScreen){
HTMLHandler.eventHandler(i, "onclick", "OnStartUp.fileInputScreen()");
}
else{
HTMLHandler.eventHandler(i, "onclick", "language.launchHomeScreen()");
}
}
}

class Symbols extends Screen{

constructor(symbol){
super();
this.symbol = symbol;
this.id = this.symbol.getAttribute('ID');
this.symbname = this.symbol.getElementsByTagName("SYMBNAME")[0].childNodes[0].nodeValue;
this.alphabet = [];
this.latin = [];
this.prompt;
this.comment;
this.soundsDir;
this.squares = [];
this.box;
this.divs = [];
}

loadValues(){
super.loadValues();   
var allSymbols = this.symbol.getElementsByTagName("ALPHABET")[0].childNodes[0].nodeValue;
this.alphabet = allSymbols.split(" ");
var allLatinChars = this.symbol.getElementsByTagName("LATIN")[0].childNodes[0].nodeValue;
this.latin = allLatinChars.split(" ");

var promptT = this.symbol.getElementsByTagName("PROMPT");
if(promptT.length == 1)
this.prompt = this.symbol.getElementsByTagName("PROMPT")[0].childNodes[0].nodeValue; 

var commentT = this.symbol.getElementsByTagName("COMMENT");
if(commentT.length == 1)
this.comment = this.symbol.getElementsByTagName("COMMENT")[0].childNodes[0].nodeValue; 

var soundsDirT = this.symbol.getElementsByTagName("SOUNDSDIR");
if(soundsDirT.length == 1)
this.soundsDir = this.symbol.getElementsByTagName("SOUNDSDIR")[0].childNodes[0].nodeValue;  
}

displayScreen(){
super.displayScreen();
this.loadValues();
const self = this;

var d = HTMLHandler.div(this.body, "width:80%;height:40%;border:3px solid black; display:table;s margin-left:40px; margin:auto;");
if(this.prompt !== undefined)
HTMLHandler.h1(d, this.prompt );
HTMLHandler.br(d);

var h = HTMLHandler.hr(d);

for (var i = 0; i < this.alphabet.length; i++) {
var d2 = HTMLHandler.div(h, "width:8%;border:1px solid black;display:table; display:inline-table;");
var p1 = HTMLHandler.p(d2, "display:table;margin:auto;align:center;");
//Speacial Characters
HTMLHandler.text(p1, 20, this.alphabet[i]);
//play sound button
var p2 = HTMLHandler.p(p1, "display:table;margin:auto;align:center;");
if(this.soundsDir !== undefined){
    var imag = HTMLHandler.img(p1, "http://icons.iconarchive.com/icons/icons8/ios7/24/Media-Controls-High-Volume-icon.png");
    HTMLHandler.eventHandler(imag, "onclick", "MiscFunctions.play('" + this.soundsDir + this.alphabet[i] +".mp3');");
}


var d3 = HTMLHandler.div(d2, "width:auto; height:auto; padding:30%; border:1px solid black;display:table; margin:auto;");
d3.occupied = false;
d3.currentBox = null;
d3.pos = i;
d3.addEventListener("dragover", this.dragover);
d3.addEventListener("dragenter", this.dragenter);
d3.addEventListener("drop", function(){ self.checkOnDrop(this);});
this.divs[i] = d3;


}

HTMLHandler.br(d);
HTMLHandler.hr(d);

var p1 = HTMLHandler.p(d, "margin-top:10px; word-spacing:5px; color:blue;");

for(var i = 0; i < this.latin.length; i++){


var d4 = HTMLHandler.div(p1, "width:50px;height:50px; display:table; display:inline-table;");


var orderedLatin = this.latin.slice();
orderedLatin.sort();

var b1 = HTMLHandler.inpuButton(d4, "button" + (i+1), orderedLatin[i]);

b1.originalDiv = d4;
b1.currentDiv = null;


this.squares[i] = b1;
this.squares[i].draggable = true;
this.squares[i].ondragstart = function(){ self.changeBox(this); };
}

var p2 = HTMLHandler.p(this.body, "display:table; margin:auto;  margin-top:20px;");
var b2 = HTMLHandler.inpuButton(p2, "clear", "Clear", "red");
HTMLHandler.eventHandler2(b2, "onclick", function () { self.clear(); });        

var b4 = HTMLHandler.inpuButton(p2, "check", "Check", "lightblue");
HTMLHandler.eventHandler2(b4, "onclick", function () { var a = self.checkAnswers(); 
                                        if (a == true) {
                                            MiscFunctions.play("general/right_answer.mp3");
                                        }
                                        else{
                                            MiscFunctions.play("general/wrong_answer.mp3");
                                            this.disabled = true;
                                            self.showSolution(p2);
                                        }

});

this.displayContinueButton();
}

changeBox(s){
this.box = s;
}

dragover(e) {
e.preventDefault()
}

dragenter(e) {
e.preventDefault()
}

drop() {
this.append(box)
}

checkOnDrop(b){

var pos;
for (var i = 0; i < this.alphabet.length; i++) {
if(this.latin[i] == this.box.value){
    pos = i;
    break;
}
}

if(b.pos != pos)
return;

if(b.occupied == false){ 
b.append(this.box);

if(this.box.currentDiv != null){
    this.box.currentDiv.occupied = false;
}

this.box.currentDiv = b;

b.currentBox = this.box; 
b.occupied = true;
}
else{

if(this.box.currentDiv != null){

    this.box.currentDiv.append(b.currentBox);
    this.box.currentDiv.currentBox = b.currentBox;

    b.append(this.box);
    b.currentBox = this.box;
    this.box.currentDiv = b;

}
else{

    b.currentBox.originalDiv.append(b.currentBox);
    b.currentBox.currentDiv = null;

    b.append(this.box);
    b.currentBox = this.box;
    this.box.currentDiv = b;

}

} 


}

showSolution(p){
HTMLHandler.br(p);
HTMLHandler.br(p);

var d1 = HTMLHandler.div(p, "width:auto;height:auto;padding:10px;border:1px solid black;display:table;text-align: center;");

for (var i = 0; i < this.alphabet.length; i++) {
HTMLHandler.text(d1, 16, "\"" + this.alphabet[i] + "\" in " + this.symbname + " is \"" + this.latin[i] + "\" in the latin alphabet.");
HTMLHandler.br(d1);
}
}

clear(){
for(var i = 0; i < this.squares.length; i++){
this.squares[i].originalDiv.append(this.squares[i]);
}
for(var i = 0; i < this.divs.length; i++){
this.divs[i].occupied = false;
this.divs[i].currentBox = null;
}
}

checkAnswers(){

for(var i = 0; i < this.divs.length; i++){

if(this.divs[i].currentBox != null){

    if(this.divs[i].currentBox.value != this.latin[i]){
        return false;
    }

}
else{
    return false;
}

}
return true;
}

displayContinueButton(){
//continue prompt
var p4 = HTMLHandler.p(this.body, "display:table; margin:auto;  margin-top:20px;");
if(language.symbols.length > this.id){
var b3 = HTMLHandler.inpuButton(p4, "Next", "Next Symbol Challenge", "white");
HTMLHandler.eventHandler(b3, "onclick", "language.displayNextSymbols()");
}else{
var b3 = HTMLHandler.inpuButton(p4, "Finish", "Finish", "white");
HTMLHandler.eventHandler2(b3, "onclick", function() { MiscFunctions.play("general/lesson_complete.mp3"); language.launchHomeScreen();});
}
}   
}

class LessonScreen extends Screen{

constructor(screen){
super();
this.screen = screen;
this.prompt = null;
this.original = null;
this.screenPassed = false;
this.isCorrect = false;

}

loadValues(){
super.loadValues();
this.prompt = this.screen.getElementsByTagName("PROMPT")[0].childNodes[0].nodeValue;
this.original = this.screen.getElementsByTagName("ORIGINAL")[0].childNodes[0].nodeValue;
}

displayContinueButton(){
const self = this;

var p4 = HTMLHandler.p(this.body, "display:table; margin:auto;  margin-top:20px;");
var b3 = HTMLHandler.inpuButton(p4, "Continue", "Continue", "white");
if(language.getCurrentLesson().getIncorrectScreens() != 1){
HTMLHandler.eventHandler2(b3, "onclick", function(){ if(self.checkFinalAnswer() == true){
                                        self.isCorrect = true;
                                    }   
                                        
                                    language.getCurrentLesson().displayNextScreen();  

                                    });
}else{
HTMLHandler.eventHandler2(b3, "onclick", function(){ if(self.checkFinalAnswer() == true){
                                        self.isCorrect = true;
                                        language.launchLessonCompleteScreen(); 
                                    } else{
                                        language.getCurrentLesson().displayNextScreen();    
                                    }
                                    });
}

}
}

class Keyboard extends LessonScreen{

constructor(screen){
super(screen);
this.sound;
this.translations = [];
}

loadValues(){
super.loadValues();
if (this.screen.getElementsByTagName("SOUND").length > 0)
this.sound = this.screen.getElementsByTagName("SOUND")[0].childNodes[0].nodeValue;
for(var i = 0; i < this.screen.getElementsByTagName("TRANSLATION").length; i++){ 
this.translations[i] = this.screen.getElementsByTagName("TRANSLATION")[i].childNodes[0].nodeValue;
}
}

displayScreen(){
this.loadValues();
super.displayScreen();
// a div, only because we want a border
var d = HTMLHandler.div(this.body, "border:3px solid black; display:table; padding:20px; margin-left:40px; margin:auto;");
HTMLHandler.h1(d, this.prompt);

// first line
var p1 = HTMLHandler.p(d, "padding-left:40px; word-spacing:3px;");
if(this.sound != null){
var i = HTMLHandler.img(p1, "http://icons.iconarchive.com/icons/icons8/ios7/32/Media-Controls-High-Volume-icon.png");
HTMLHandler.eventHandler(i, "onclick", "MiscFunctions.play('" + this.sound +"');");
}
HTMLHandler.text(p1, 16, " ");
HTMLHandler.text(p1, 32, this.original);

// second line
var p2 = HTMLHandler.p(d, "padding-left:20px;");
var i = HTMLHandler.inputActiveText(p2, "answer", 40, 24, "Type this in English");
HTMLHandler.eventHandler(i, "onkeydown", "if(event.keyCode == 13) document.getElementById('check').click();");
HTMLHandler.text(p2, 16, " ");
var b1 = HTMLHandler.inpuButton(p2, "check", "Check", "lightblue");

const self = this;
HTMLHandler.eventHandler2(b1, "onclick", function () { MiscFunctions.validateAnswer(document.getElementById('answer').value, self.translations); b1.disabled = true; self.showAnswers(d);});

super.displayContinueButton();
}

showAnswers(d){
var p4 = HTMLHandler.p(d, "padding-left:20px;");

for(var i = 0; i < this.translations.length; i++){
 HTMLHandler.br(p4);
 HTMLHandler.text(p4, 16, (i+1) + " - " + this.translations[i]);

}
}

checkFinalAnswer(){

var answer = document.getElementById('answer').value;

for(var i = 0; i < this.translations.length; i++)
if( answer == this.translations[i] )
    return true;
return false;
}
}

class Pairs extends LessonScreen{

constructor(screen){
super(screen);
this.pairs = [];
this.pairings = [];
this.words = [];
this.chosenPair;
this.chosenButton;
this.buttons = [];
this.wrongAttempts;
}

loadValues(){

super.loadValues();
var solution = this.screen.getElementsByTagName("SOLUTION")[0].childNodes[0].nodeValue;
this.pairs = solution.split(" ");
this.words = this.original.split(" ");
this.pairings = [this.words.length];
this.wrongAttempts  = 0;
this.chosenPair = null;
this.chosenButton = null;
for (var i = 0; i < this.words.length; i++){
for(var j = 0; j < this.words.length; j++){
    if(this.pairs[i] == this.words[j]){
        this.pairings[j] = Math.ceil((i + 1)/2);
        break;
    }
}
}
}


managePairs(pos){

if(this.chosenPair == null){

this.chosenPair = this.pairings[pos];
this.chosenButton = pos;
this.buttons[pos].disabled = true;
}else{

if(this.chosenPair == this.pairings[pos]){
    this.buttons[pos].disabled = true;
}else{
    this.buttons[this.chosenButton].disabled = false; 
    this.wrongAttempts++;
}
this.chosenButton = null; 
this.chosenPair = null;
}

if(this.wrongAttempts > 6){

var d = HTMLHandler.div(this.body, "display:table; margin:auto; margin-top:20px");
HTMLHandler.text(d, 16, "Maybe next time!");
HTMLHandler.br(d);
for (var i = 0; i < this.pairs.length; i = i+2) {
    HTMLHandler.br(d);
    this.buttons[i].disabled = true;
    this.buttons[i + 1].disabled = true;
    HTMLHandler.text(d, 12, this.pairs[i + 1] + " means " + this.pairs[i]);
}

}
}

displayScreen(){
this.loadValues();
super.displayScreen();

var d = HTMLHandler.div(this.body, "border:3px solid black; display:table; padding:20px; margin-left:40px; margin:auto;");
HTMLHandler.h1(d, this.prompt);

var p1 = HTMLHandler.p(d, "word-spacing:1px; bottom:0; right:0");

const self = this;
for(var i = 0; i < this.words.length; i++){
this.buttons[i] = HTMLHandler.inpuButton(p1, "wordB" + (i+1), this.words[i], "lightblue");
this.buttons[i].pos = i;

HTMLHandler.eventHandler2(this.buttons[i], "onclick", function () {self.managePairs(this.pos);});
}

p1 = HTMLHandler.p(this.body, "display:table;margin:auto;word-spacing:1px; margin-top:2px;");
HTMLHandler.img(p1, "http://icons.iconarchive.com/icons/martz90/circle-addon2/24/warning-icon.png");
HTMLHandler.text(p1, 12, " Phsst! Think before you click, you only have 6 wrong attempts!");

super.displayContinueButton();

}

checkFinalAnswer(){

for(var i = 0; i < this.buttons.length; i++){

if(this.buttons[i].disabled == false){
    return false;
}
}

if(this.wrongAttempts > 6){
return false;
}
else{
return true;
}

}    
}

class Blocks extends LessonScreen{

constructor(screen){
super(screen);
this.solution = null;
this.solutionBlocks = [];
this.blocks = [];
this.squares = [];
this.box;
this.divs = [];
}

loadValues(){
super.loadValues();
this.solution = this.screen.getElementsByTagName("SOLUTION")[0].childNodes[0].nodeValue;
this.solutionBlocks = this.solution.split(" ");
this.blocks = this.screen.getElementsByTagName("BLOCKS")[0].childNodes[0].nodeValue.split(" ");
}

displayScreen(){
this.loadValues();
super.displayScreen();

var d = HTMLHandler.div(this.body, "width:500px;height:70px;padding:10px;border:3px solid black; display:table;s margin-left:40px; margin:auto;");
HTMLHandler.h1(d, this.prompt );
HTMLHandler.text(d, 16, " ");
HTMLHandler.text(d, 32, this.original);
HTMLHandler.br(d);

HTMLHandler.br(d);

const self = this;

var h = HTMLHandler.hr(d);

for(var i = 0; i < this.solutionBlocks.length; i++){
var d2 = HTMLHandler.div(h, "width:auto;height:auto;padding:10px;border:1px solid black;display:table;display: inline-table;");
d2.occupied = false;
d2.currentBox = null;
d2.addEventListener("dragover", this.dragover);
d2.addEventListener("dragenter", this.dragenter);
d2.addEventListener("drop", function(){ self.checkOnDrop(this); });
this.divs[i] = d2;
}


HTMLHandler.br(d);
HTMLHandler.hr(d);

var p1 = HTMLHandler.p(d, "margin-top:10px; word-spacing:50px; color:blue;");

for(var i = 0; i < this.blocks.length; i++){


var d3 = HTMLHandler.div(p1, "width:50px;height:50px;padding:10px; display:table;display: inline-table;");

var b1 = HTMLHandler.inpuButton(d3, "word" + (i+1), this.blocks[i]);
b1.originalDiv = d3;

b1.currentDiv = null;


this.squares[i] = b1;
this.squares[i].draggable = true;
this.squares[i].ondragstart = function(){ self.changeBox(this); };
}


var p4 = HTMLHandler.p(this.body, "display:table; margin:auto;  margin-top:20px;");

var b4 = HTMLHandler.inpuButton(p4, "clear", "Clear", "red");
HTMLHandler.eventHandler2(b4, "onclick", function () { self.clear(); });


var b6 = HTMLHandler.inpuButton(p4, "check", "Check", "lightblue");
HTMLHandler.eventHandler2(b6, "onclick", function () { var a = self.checkAnswers(); 
                                        if (a == true) {
                                            MiscFunctions.play("general/right_answer.mp3");
                                        }
                                        else{
                                            MiscFunctions.play("general/wrong_answer.mp3");
                                            self.showSolution(p4);
                                        } 
                                        this.disabled = true;
                                        b4.disabled = true;

});


super.displayContinueButton();

}

changeBox(s){
this.box = s;
}


checkOnDrop(b){

if(b.occupied == false){ 
b.append(this.box);

if(this.box.currentDiv != null){
    this.box.currentDiv.occupied = false;
}

this.box.currentDiv = b;

b.currentBox = this.box; 
b.occupied = true;
}
else{

if(this.box.currentDiv != null){

    this.box.currentDiv.append(b.currentBox);
    this.box.currentDiv.currentBox = b.currentBox;

    b.append(this.box);
    b.currentBox = this.box;
    this.box.currentDiv = b;

}
else{

    b.currentBox.originalDiv.append(b.currentBox);
    b.currentBox.currentDiv = null;

    b.append(this.box);
    b.currentBox = this.box;
    this.box.currentDiv = b;

}

} 


}

clear(){

for(var i = 0; i < this.squares.length; i++){
this.squares[i].originalDiv.append(this.squares[i]);
}
for(var i = 0; i < this.divs.length; i++){
this.divs[i].occupied = false;
this.divs[i].currentBox = null;
}

}


showSolution(p){

HTMLHandler.br(p);
HTMLHandler.br(p);

var d1 = HTMLHandler.div(p, "width:auto;height:auto;padding:10px;border:1px solid black;display:table;text-align: center;");

HTMLHandler.text(d1, 16, this.solution);
}


checkAnswers(){

for(var i = 0; i < this.divs.length; i++){

if(this.divs[i].currentBox != null){

    if(this.divs[i].currentBox.value != this.solutionBlocks[i]){
        return false;
    }

}
else{
    return false;
}

}
return true;
}

dragover(e) {
e.preventDefault()
}

dragenter(e) {
e.preventDefault()
}

drop() {
this.append(box)
}

checkFinalAnswer(){
return this.checkAnswers();
}
}

class HomeScreen extends Screen{

constructor(lessons){
super();
this.lessons = lessons;
this.symbols;
}

loadSymbols(symbols){
this.symbols = symbols;
}

displayScreen(){
super.displayScreen();

var p1 = HTMLHandler.p(this.body, "display:table; padding-left:40px; word-spacing:10px; margin:auto");
HTMLHandler.text(p1, 30, "Welcome!");

var d1 = HTMLHandler.div(this.body, "border:1px solid black; float:left; display:table; padding:20px; margin-left:40px;");
HTMLHandler.h1(d1, "Lessons");
p1 =HTMLHandler.p(d1, "padding-left:40px; word-spacing:10px; color:blue;");


for(var i = 0; i < this.lessons.length; i++){

HTMLHandler.br(p1);
var id = this.lessons[i].id;
var b = HTMLHandler.inpuButton(p1, 20, "Lesson " + id);

HTMLHandler.eventHandler(b, "onclick", "language.runLesson(" + i + ")");
}

if(this.symbols !== undefined){
var d2 = HTMLHandler.div(this.body, "border:1px solid black; float:left; display:table; padding:20px; margin-left:40px;");
HTMLHandler.h1(d2, "Symbols");
p1 = HTMLHandler.p(d2, "padding-left:40px; word-spacing:10px; color:blue;");

for(var i = 0; i < this.symbols.length; i++){

    HTMLHandler.br(p1);
    var b = HTMLHandler.inpuButton(p1, 20, this.symbols[i].symbname);

    HTMLHandler.eventHandler(b, "onclick", "language.runSymbols(" + i + ")");
}

}

}
}

class LessonCompleteScreen extends LessonScreen{

constructor(id){
super(null);
this.lessonId = id;
}

displayScreen(){
super.displayScreen();


var p1;

p1 = HTMLHandler.p(this.body, "display:table; padding-left:40px; word-spacing:3px; margin:auto");

HTMLHandler.h1(p1, "Lesson "+ this.lessonId + " has been completed!");
}
}

function onLoad() {
OnStartUp.fileInputScreen();
}