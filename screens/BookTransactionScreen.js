import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity,TextInput, Image, KeyboardAvoidingView, ToastAndroid } from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import db from '../config';
import firebase from 'firebase'



export default class TransactionScreen extends React.Component{

    constructor(){
        super();
        this.state={
            hasCameraPermissios: null,
            scanned: false,
            scannedBookId:'',
            buttonState:'normal',
            scannedStudentId:'',
            transactionMessage:''

        }
    }

    getCameraPermissions=async(id)=>{
        const {status}=await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            //status==="granted" is true when the user has granted the permission
            hasCameraPermissios: status==="granted",
            buttonState: id,
            scanned:false
        })


    }

    handleBarCodeScanned=async({type, data})=>{
        const {buttonState}=this.state
        if(buttonState==='BookId'){
            this.setState({
                scanned:true,
                scannedBookId:data,
                buttonState:'normal'
            })
        }
        else if(buttonState==='StudentId'){
            this.setState({
                scanned:true,
                scannedStudentId:data,
                buttonState:'normal'
            })
        }
    }

    checkBookEligibility=async()=>{
        const bookRef=await db.collection("books").where("bookId", "==", this.state.scannedBookId).get()
        var transactionType=""
        if(bookRef.docs.length==0){
            transactionType=false
            
        }

        else{
            bookRef.docs.map((doc)=>{
                var book=doc.data();
                if(book.bookAvailability){
                    transactionType="Issue"
                }
                else{
                    transactionType="Return"
                }
            })
        }

        return transactionType
    }

    checkStudentEligibilityForBookIssue=async()=>{
        const studentRef=await db.collection("students").where("studentId", "==", this.state.scannedStudentId).get()
        var isStudentEligible=""
        if(studentRef.docs.length==0){
            isStudentEligible=false;
            alert("Student ID doesn't exists!")
            this.setState({
                scannedStudentId:'',
                scannedBookId:''
            })

        }
        
        
        else{
            studentRef.docs.map((doc)=>{
                var student=doc.data();
                if(student.numberOfBooksIssued<2){
                    isStudentEligible=true;
                }
                else{
                    isStudentEligible=false;
            alert("Student has already issued 2 books!")
            this.setState({
                scannedStudentId:'',
                scannedBookId:''
            })
                }
            })
        }

        return isStudentEligible
    }

    checkStudentEligibilityForBookReturn=async()=>{
        const transactionRef=await db.collection("transactions").where("bookId", "==", this.state.scannedBookId).limit(1).get()
        var isStudentEligible=""
        transactionRef.docs.map((doc)=>{
            var lastBookTransaction=doc.data();
            if(lastBookTransaction.studentId===this.state.scannedStudentId){
                isStudentEligible=true
            }

            else{
                isStudentEligible=false;
            alert("This Book Wasn't Issued By The Student")
            this.setState({
                scannedStudentId:'',
                scannedBookId:''
            })
            }
        })

        return isStudentEligible
    }

    initiateBookIssue=async()=>{
        db.collection("transactions").add({
            'studentId': this.state.scannedStudentId,
            'bookId': this.state.scannedBookId,
            'date': firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Issue"
        })

        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':false
        })

        db.collection("students").doc(this.state.scannedStudentId).update({
            "numberOfBooksIssued": firebase.firestore.FieldValue.increment(1)
        })
    }

    initiateBookReturn=async()=>{
        db.collection("transactions").add({
            'studentId': this.state.scannedStudentId,
            'bookId': this.state.scannedBookId,
            'date': firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Return"
        })

        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':true
        })

        db.collection("students").doc(this.state.scannedStudentId).update({
            "numberOfBooksIssued": firebase.firestore.FieldValue.increment(-1)
        })
    }

    handleTransaction=async()=>{
        //verify if the student is eligible for book is issue or return or none.
        //student's id exists in db.
        //issue: no of books issued should be less than 2.
        //issue: verify book availability.
        //return: last transaction => book issued by the student.

        var transactionType=await this.checkBookEligibility();

        if(!transactionType){
            alert("Book Doesn't exists in our Library");
            this.setState({
                scannedStudentId:'',
                scannedBookId:''
            })
        }

        else if(transactionType==="Issue"){
            var isStudentEligible=await this.checkStudentEligibilityForBookIssue()
            if(isStudentEligible){
                this.initiateBookIssue();
                alert("Book Successfully Issued")
            }
        }

        else if(transactionType==="Return"){
            var isStudentEligible=await this.checkStudentEligibilityForBookReturn()
            if(isStudentEligible){
                this.initiateBookReturn();
                alert("Book Successfully Returned")
            }
        }
    }


    render(){

        const hasCameraPermissios=this.state.hasCameraPermissios;
        const scanned= this.state.scanned;
        const buttonState=this.state.buttonState

        if(buttonState!=="normal"&&hasCameraPermissios){
            return(
                <BarCodeScanner
                onBarCodeScanned={scanned?undefined:this.handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
                />
            )
        }
        else if(buttonState==="normal"){
            return(
                <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
                    <View>
                    <Image source={require("../assets/booklogo.jpg")}
                        style={{width:200, height:200}}
          
                    />

                    <Text style={{textAlign:'center', fontSize:30}}>Wireless Library</Text>
                    </View>

                    <View style={styles.inputView}>
                        <TextInput
                        style={styles.inputBox}
                        placeholder="Book id"
                        onChangeText={text=>this.setState({
                            scannedBookId:text
                        })}
                        value={this.state.scannedBookId}
                        />

                        <TouchableOpacity
                        style={styles.scanButton}
                        onPress={()=>{
                            this.getCameraPermissions('BookId')
                        }}>

                            <Text style={styles.buttonText}>
                                Scan
                            </Text>
                        </TouchableOpacity>

                    </View>

                    <View style={styles.inputView}>
                        <TextInput
                        style={styles.inputBox}
                        onChangeText={text=>this.setState({
                            scannedStudentId:text
                        })}
                        placeholder="Student id"
                        value={this.state.scannedStudentId}
                        />

                        <TouchableOpacity
                        style={styles.scanButton}
                        onPress={()=>{
                            this.getCameraPermissions('StudentId')
                        }}>

                            <Text style={styles.buttonText}>
                                Scan
                            </Text>
                        </TouchableOpacity>

                    </View>

                    <TouchableOpacity
                    style={styles.submitButton}
                    onPress={async()=>{
                        var transactionMessage=await this.handleTransaction()
                    }}
                    
                    >
                    <Text style={styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                    
                </KeyboardAvoidingView>
            )
        }
    }
}

const styles=StyleSheet.create({

    container:{
     flex:1,
     justifyContent:"center",
     alignItems: 'center'
    },

    displayText:{
        fontSize:15,
        textDecorationLine:'underline',

    },
    scannedButton:{
        backgroundColor:'green',
        padding:10,
        margin:10,

    },

    buttonText:{
        fontSize:20,
        textAlign:'center',
        marginTop:10,

    },

    inputView:{
        flexDirection:'row',
        margin:20,

    },

    inputBox:{
        width:200,
        height:40,
        borderWidth:1.5,
        borderRightWidth:0,
        fontSize:20
    },
    scanButton:{
        backgroundColor:'green',
        width:50,
        borderWidth:1.5,
        borderLeftWidth:0
    },
    submitButton:{
        backgroundColor:'#fbc02d',
        width:100,
        height:50
    },
    submitButtonText:{
        padding:10,
        textAlign:'center',
        fontSize:20,
        fontWeight:'bold',
        color:'white'
    }
})
