package com.satyam.quicknova

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.satyam.quicknova.ui.screens.HomeScreen
import com.satyam.quicknova.ui.screens.QuizScreen
import com.satyam.quicknova.ui.theme.QUICKNOVATheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            QUICKNOVATheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    QuizNovaApp()
                }
            }
        }
    }
}

@Composable
fun QuizNovaApp() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onNavigateToQuiz = { category ->
                    navController.navigate("quiz/$category")
                }
            )
        }
        composable("quiz/{category}") { backStackEntry ->
            val category = backStackEntry.arguments?.getString("category") ?: "Quiz"
            QuizScreen(
                category = category,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}