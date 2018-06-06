(* RegExp module body *)

(* 
Aluno 1: Pedro Miguel Pereira Agostinho - 50203
Aluno 2: Pedro Tiago Fernandes de Almeida - 50490

Comment:

Implementamos todas as funcoes pedidas, por vezes com funcoes auxiliares.

*)

(*
01234567890123456789012345678901234567890123456789012345678901234567890123456789
   80 columns
*)


(* REGULAR EXPRESSIONS *)

type regExp =
      Str of string
    | Class of string
    | NClass of string
    | Any
    | Seq of regExp * regExp
    | Or of regExp * regExp
    | Not of regExp
    | Zero of regExp
    | ZeroOrOne of regExp
    | ZeroOrMore of regExp
    | OneOrMore of regExp
    | Repeat of int * int * regExp
;;


(* STRINGS *)

let cut s =
    (String.get s 0, String.sub s 1 ((String.length s)-1))
;;

let join x xs =
    (Char.escaped x)^xs
;;

let rec list_of_string s =
    if s = "" then []
    else
        let (x,xs) = cut s in
            x::list_of_string xs
;;

let rec string_of_list l =
    match l with
       [] -> ""
     | x::xs -> join x (string_of_list xs)
;;

(* auxiliar functions*)

(*l2 must contain every l1, returs rest of l2*)
let rec prefix l1 l2 =
  match l1,l2 with
  | [], [] -> (true, [])
  | x::xs, [] -> (false, [])
  | [], y::ys -> (true, l2)
  | x::xs, y::ys -> if x = y then prefix xs ys else (false, [])
;;

let rec belongs v l =
	match l with
	| [] -> false
	| x::xs -> if (v=x) then true else belongs v xs
;;


let rec prepend l1 m =
		match l1 with
		| [] -> []
		| (b,m2,r)::t -> if b then (b,m@m2,r)::(prepend t m) else (prepend t m)
;;

let rec biggest l1 b =
	match l1,b with
	| [],_ -> b
	| ((p,m,r)::t),(p2,m2,r2) -> 
		if (List.length m) > (List.length m2) then 
			(biggest t (p,m,r))
	 else
			(biggest t b)
;;


(* matchAtStart *)

let rec inClass l1 v =
    match l1 with
    | [] -> []
    | x::xs -> if x = v then [x] else (inClass xs v)
;;

let rec notInClass l1 v =
    match l1 with
    | [] -> [v]
    | x::xs -> if x = v then [] else (notInClass xs v)
;;



let rec matchAtStartRE line re =
    match re with
      
      | Str s -> let st = (list_of_string s) in
                   let (b, rest) = prefix st line in
                      if b then
                        (true,st,rest)
                      else 
                        (false,[],[])
                        
      | Class s ->(match line with
                  | [] -> (false, [], [])
                  | h::t -> let a = (inClass (list_of_string s) h) in 
                              if a = [] then 
                                  (false,[],[])
                              else 
                                  (true,a,t))
                            
      | NClass s ->(match line with
                  | [] -> (false, [], [])
                  | h::t -> let a = (notInClass (list_of_string s) h) in
                               if a = [] then 
                                  (false,[],[]) 
                               else 
                                  (true,a,t))

      | Any -> (match line with
            |[] -> (false , [], []) 
            |h::t -> (true, [h], t))

      | Seq (p, q) -> let (b1, m1, r1) = matchAtStartRE line p in
                        if b1 then
                            let (b2, m2, r2) = matchAtStartRE r1 q in
                              if b2 then
                                (true, m1@m2, r2)
                              else
                                (false, [], [])
                        else 
                          (false, [], [])
                          
      | Or (p, q) -> let (b1, m1, r1) = matchAtStartRE line p in
                        let (b2, m2, r2) = matchAtStartRE line q in
                          if b1 && b2 then
                            if (List.length m2) > (List.length m1) then
                              (b2, m2, r2)
                            else
                              (b1, m1, r1)
                          else if b1 then
                              (b1, m1, r1)
                          else
                              (b2, m2, r2)

                              
      | Not p -> let (b, m, r) = matchAtStartRE line p in
                    if b then
                      (false, [], [])
                    else
                      (true, [], line)
                              
      | Zero p -> (true, [], line)

      | ZeroOrOne p -> let (b, m, r) = matchAtStartRE line p in
                          if b then
                              (true, m, r)
                          else
                              (true, [], line) 
      
      | ZeroOrMore p -> let (b, m, r) = matchAtStartRE line p in
            if b && m <> [] then
              let (b2, m2, r2) = matchAtStartRE r (ZeroOrMore p) in 
                (true, m@m2, r2)
            else
              (true, [], line)
                              
                              

      | OneOrMore p -> let (b, m, r) = matchAtStartRE line p in
            if b && m <> [] then
              let (b2, m2, r2) = matchAtStartRE r (OneOrMore p) in 
                if b2 then
                  (true, m@m2, r2)
                else
                  (true, m, r)
            else if b then
              (true, [], line)
            else
              (false, [], [])

     | Repeat (min, max, p) -> if (max < min) || (max < 0) then
	(false, [], [])
else
	let (b, m, r) = matchAtStartRE line p in
  match b, min, max with
  | false, mi, _ -> if mi <= 0 then (true, [], line) else (false, [], [])
  | true, mi, ma -> if ma <= 0 then (true, [], line) else
											
if m = [] && r = line then
		if (pred(mi)) <= 0 then (true, [], line) else (false, [], [])																									
													
else
  let (b2, m2, r2) = matchAtStartRE r (Repeat (pred(min), pred(max), p)) in 
    if b2 then
      (true, m@m2, r2)
    else
    (false, [], [])
;;

let matchAtStart line re =
    let (b,m,r) = matchAtStartRE (list_of_string line) re in
        (b, string_of_list m, string_of_list r)
;;


(* firstMatch *)


let rec firstMatchRE line re =
   match (matchAtStartRE line re) with
  | (false, _, _) -> (match line with
                    | [] -> (false, [], [], []) (*nao ha mais na lista*)
                    | h::t -> let (b, m1, m2, r) = firstMatchRE t re in 
                                  if b then
                                    (b, h::m1, m2, r)
                                  else
                                    (b, m1, m2, r))                                   
  | (true, m, r) -> (true, [], m, r)
;;

let firstMatch line re =
    let (b,p,m,r) = firstMatchRE (list_of_string line) re in
        (b, string_of_list p, string_of_list m, string_of_list r)
;;


(* allMatches *)

let rec allMatchesREAssist pre line re=
	let (b,p,m,r) = firstMatchRE line re in
if b && m = [] then
if r = line then
	match r with
| [] -> [pre,m,r]
| h::t -> [pre,m,r]@(allMatchesREAssist (pre@[(List.hd r)]) (List.tl r) re)
else
	match r with
| [] -> []
| h::t -> [(pre@[h]),m,t]@(allMatchesREAssist (pre@[h]) t re)
else if b then
	[pre@p,m,r]@(allMatchesREAssist (pre@p@m) r re)
else
	[]
;;

let rec allMatchesRE line re =
	let (b,p,m,r) = firstMatchRE line re in
		if b && m = [] then
			if line = [] then
				[p,m,r]
			else
				[p,m,r]@(allMatchesREAssist [(List.hd r)] (List.tl r) re)
		else if b then
			[p,m,r]@(allMatchesREAssist (p@m) r re)
		else
			[]
;;

let allMatches line re =
    List.map
(fun (p,m,r) -> (string_of_list p, string_of_list m, string_of_list r))
(allMatchesRE (list_of_string line) re)
;;


(* replaceAllMatches *)

let rec replaceAllMatchesRE line rpl re =
    match (allMatchesRE line re) with
		| [] -> line@[]
		| (pre, toReplace, pos)::t ->  pre@rpl@(replaceAllMatchesRE pos rpl re)
;;

let replaceAllMatches line rpl re =
    let lineStr = list_of_string line in
      let rplStr = list_of_string rpl in
        let res = replaceAllMatchesRE lineStr rplStr re in
          string_of_list res
;;


(* allMatchesFile *)

let rec loadChannel ci=
    try
        let x = input_line ci in
                x::loadChannel ci
    with End_of_file -> []
;;
 
let load ni =
    let ci = open_in ni in
        let t = loadChannel ci in
            close_in ci; t
;;
 
let rec allMatchesAssist fileRows re =
    match fileRows with
            | [] -> []
            | h::t -> [(allMatches h re)]@(allMatchesAssist t re)
;;
 
let allMatchesFile ni re =
    let fileRows = load ni in
            allMatchesAssist fileRows re
;;


(* allMatchesOverlap *)

let rec allMatchesOverlapREAssist pre line re=
	let (b,p,m,r) = firstMatchRE line re in
		if b && m = [] then
			if r = line then
				match r with
				| [] -> [pre,m,r]
				| h::t -> [pre,m,r]@
				(allMatchesOverlapREAssist (pre@[(List.hd r)]) (List.tl r) re)
			else
				match r with
				| [] -> []
				| h::t -> [(pre@[h]),m,t]@
				(allMatchesOverlapREAssist (pre@p@[(List.hd m)]) ((List.tl m)@r) re)
		else if b then
			[pre@p,m,r]@
			(allMatchesOverlapREAssist (pre@p@[(List.hd m)]) ((List.tl m)@r) re)
		else
			[]
;;
 
let rec allMatchesOverlapRE line re =
        let (b,p,m,r) = firstMatchRE line re in
				if m = [] then
						allMatchesRE line re
        else if b then
            [p,m,r]@
						(allMatchesOverlapREAssist (p@[(List.hd m)]) ((List.tl m)@r) re)
        else
            []
;;

let allMatchesOverlap line re =
    List.map
(fun (p,m,r) -> (string_of_list p, string_of_list m, string_of_list r))
(allMatchesOverlapRE (list_of_string line) re)
;;


(* matchAtStartGreedyRE *)

let rec orMoreAux pre line p =
	let (b,m,r) = matchAtStartRE line p in
			if b then
				(b,(pre@m),r)::(orMoreAux (pre@m) r p)
			else
				[]
;;

let rec greedyRepeatAux min max pre line p =
	let (b,m,r) = matchAtStartRE line p in
			match b, min, max with
      | false, mi, _ -> [] 
      | true, mi, ma -> if ma <= 0 then 
							[] (*[(true, [], line)] *)
						else
							if m = [] && r = line then
									if (pred(mi)) <= 0 then 
										[(true, [], line)] 
									else 
										[]	
							else if b then
								(b,(pre@m),r)::
								(greedyRepeatAux (pred(min)) (pred(max)) (pre@m) r p)
							else
								[]																				
;;

let rec matchAtStartAux line re =
		match re with
		
		| Str s -> let (b,m,r) = (matchAtStartRE line re) in
										if b then 
											[b,m,r]
										else
											[]   
			
		| Class s -> let (b,m,r) = (matchAtStartRE line re) in
										if b then 
											[b,m,r]
										else
											[]     
			
		| NClass s -> let (b,m,r) = (matchAtStartRE line re) in
										if b then 
											[b,m,r]
										else
											[]
			
		| Any -> let (b,m,r) = (matchAtStartRE line re) in
										if b then 
											[b,m,r]
										else
											[]		
			
		| Seq (p, q) -> List.flatten ((List.map (fun (b,m,r) ->
			 (prepend (matchAtStartAux r q) m)) (matchAtStartAux line p)))
			
		| Or (p, q) -> (matchAtStartAux line p)@(matchAtStartAux line q)
			
		| Not p -> if (matchAtStartAux line p) = [] then
								 [(true,[],line)] 
							 else 
								 []
			
		| Zero p -> [(true, [], line)]
			
		| ZeroOrOne p -> (true,[],line)::(matchAtStartAux line p)
			
		| ZeroOrMore p -> List.flatten (List.map 
		(fun (b,m,r) -> if b && m <> [] then
     	(b,m,r)::(orMoreAux m r p)
    else
     	[(true,[],line)]) (matchAtStartAux line p))
			
		| OneOrMore p -> List.flatten (List.map 
		(fun (b,m,r) -> if b && m <> [] then
     	(b,m,r)::(orMoreAux m r p)
    else
     	[]) (matchAtStartAux line p))
			
	
		| Repeat (min, max, p) -> 
			if (max < min) || (max < 0) then
  				[]
  		else if (matchAtStartAux line p) = [] then
  			if min = 0 then 
  				[(true,[],line)] 
  			else 
  				[]
  		else if max = 0 then
  			[(true, [], line)]
  		else 
  			let toReturn = (List.flatten (List.map (
					fun (b,m,r) -> if b then
    			if m <> [] then
    				(b,m,r)::(greedyRepeatAux (pred(min)) (pred(max)) m r p)
    			else
    				if (pred(min)) <= 0 then [(true, [], line)] else []	
    	 else
    			[])
  														 	(matchAtStartAux line p))) in
  			(if (List.length toReturn) < min then [] else toReturn )
																									
																							
;;

let matchAtStartGreedyRE line re =
    match (matchAtStartAux line re)  with
		| [] -> (false,[],[])
		| (b,m,r)::t -> (biggest t (b,m,r)) 
;;

let matchAtStartGreedy line re =
    let (b,m,r) = matchAtStartGreedyRE (list_of_string line) re in
        (b, string_of_list m, string_of_list r)
;;


