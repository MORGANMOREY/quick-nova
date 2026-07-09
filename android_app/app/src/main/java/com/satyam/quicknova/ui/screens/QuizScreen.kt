package com.satyam.quicknova.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import com.satyam.quicknova.ui.theme.PrimaryIndigo
import com.satyam.quicknova.ui.theme.SuccessGreen
import com.satyam.quicknova.ui.theme.DangerRed

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizScreen(category: String, onNavigateBack: () -> Unit) {
    var timeLeft by remember { mutableStateOf(15) }
    var selectedAnswer by remember { mutableStateOf<Int?>(null) }
    var showExplanation by remember { mutableStateOf(false) }

    LaunchedEffect(timeLeft, showExplanation) {
        if (timeLeft > 0 && !showExplanation) {
            delay(1000L)
            timeLeft--
        } else if (timeLeft == 0 && !showExplanation) {
            showExplanation = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(category, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Timer Bar
            LinearProgressIndicator(
                progress = { timeLeft / 15f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = if (timeLeft > 5) PrimaryIndigo else DangerRed,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
            Spacer(modifier = Modifier.height(24.dp))
            
            // Question Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Text(
                    text = "What is the capital of France?",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(24.dp),
                    textAlign = TextAlign.Center
                )
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Options
            val options = listOf("London", "Berlin", "Paris", "Madrid")
            options.forEachIndexed { index, option ->
                val isSelected = selectedAnswer == index
                val isCorrect = index == 2
                
                val backgroundColor = when {
                    !showExplanation && isSelected -> PrimaryIndigo.copy(alpha = 0.2f)
                    showExplanation && isCorrect -> SuccessGreen.copy(alpha = 0.2f)
                    showExplanation && isSelected && !isCorrect -> DangerRed.copy(alpha = 0.2f)
                    else -> MaterialTheme.colorScheme.surface
                }
                
                val borderColor = when {
                    !showExplanation && isSelected -> PrimaryIndigo
                    showExplanation && isCorrect -> SuccessGreen
                    showExplanation && isSelected && !isCorrect -> DangerRed
                    else -> Color.Transparent
                }

                Button(
                    onClick = { 
                        if (!showExplanation) {
                            selectedAnswer = index
                            showExplanation = true
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                        .height(60.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = backgroundColor,
                        contentColor = MaterialTheme.colorScheme.onSurface
                    ),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(2.dp, borderColor)
                ) {
                    Text(option, style = MaterialTheme.typography.titleMedium)
                }
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            if (showExplanation) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = PrimaryIndigo.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("✨ AI Explanation", fontWeight = FontWeight.Bold, color = PrimaryIndigo)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Paris is the capital and most populous city of France. It has been one of Europe's major centres of finance, diplomacy, commerce, fashion, gastronomy, and science.",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onNavigateBack,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
                ) {
                    Text("Next Question")
                }
            }
        }
    }
}
