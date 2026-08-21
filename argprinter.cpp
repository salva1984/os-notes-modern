/* argPrinter.cpp

	Written ( quickly ) by John Bell for CS 385, Spring 2009.

	Illustrates use of argc, argv, envp, and simple I/O.

*/

#include <iostream>

using namespace std;

int main( int argc, char ** argv, char ** envp ) {
	// Equivalent to ( int argc, char * argv[ ], char * envp[ ] ) {

	int i;

	cout << "\nargc = " << argc << endl;
	
	cout << "\nargv = \n";
	for( i = 0; i < argc; i++ )
		cout << "\targv[ " << i << " ] = " << argv[ i ] << endl;

	cout << "\nenvp = \n";
	i = 0;
	for(  char ** e = envp; *e; e++ )
		cout << "\tenvp[ " << i++ << " ] = \"" << *e << "\"\n";


	return 0;

} // main

