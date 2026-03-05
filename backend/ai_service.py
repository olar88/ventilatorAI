"""
AI Consultation Service - Provides clinical recommendations based on ABG values.
"""
import os
from typing import Optional
from models import ABGValues, AIConsultResponse


class AIConsultService:
    """Service for AI-powered clinical consultation."""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        self._openai_available = False
        
        # Lazy load OpenAI only when API key is provided
        if self.api_key:
            try:
                # Import OpenAI only when needed to avoid startup failures
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
                self._openai_available = True
                print("✅ OpenAI client initialized successfully")
            except ImportError as e:
                print(f"⚠️ OpenAI library not available: {e}")
                print("ℹ️ AI service will use mock responses")
            except Exception as e:
                print(f"⚠️ Failed to initialize OpenAI client: {e}")
                print("ℹ️ AI service will use mock responses")
        
    def _get_mock_response(self, abg: ABGValues) -> AIConsultResponse:
        """Generate a mock response when OpenAI API is not available."""
        
        # Simple rule-based analysis
        analysis_parts = []
        recommendations = []
        
        # pH Analysis
        if abg.ph < 7.35:
            analysis_parts.append("Acidemia detected (pH < 7.35)")
            if abg.paco2 > 45:
                analysis_parts.append("Respiratory acidosis (elevated PaCO2)")
                recommendations.append("Consider increasing respiratory rate or tidal volume")
        elif abg.ph > 7.45:
            analysis_parts.append("Alkalemia detected (pH > 7.45)")
            if abg.paco2 < 35:
                analysis_parts.append("Respiratory alkalosis (low PaCO2)")
                recommendations.append("Consider decreasing respiratory rate")
        else:
            analysis_parts.append("pH within normal range (7.35-7.45)")
        
        # Oxygenation Analysis
        if abg.pao2 < 60:
            analysis_parts.append("Severe hypoxemia (PaO2 < 60 mmHg)")
            if abg.fio2 < 0.8:
                recommendations.append(f"Increase FiO2 from {abg.fio2*100:.0f}% toward 80-100%")
            if abg.peep < 15:
                recommendations.append(f"Increase PEEP from {abg.peep} to 12-15 cmH2O (ARDSnet protocol)")
        elif abg.pao2 < 80:
            analysis_parts.append("Mild hypoxemia (PaO2 60-80 mmHg)")
            if abg.fio2 < 0.6:
                recommendations.append(f"Consider increasing FiO2 from {abg.fio2*100:.0f}%")
        else:
            analysis_parts.append("Adequate oxygenation (PaO2 > 80 mmHg)")
            if abg.fio2 > 0.6:
                recommendations.append(f"Consider weaning FiO2 from {abg.fio2*100:.0f}% to reduce oxygen toxicity risk")
        
        # Ventilation Analysis
        if abg.paco2 > 50:
            analysis_parts.append("Hypercapnia (PaCO2 > 50 mmHg)")
            recommendations.append("Permissive hypercapnia may be acceptable in ARDS if pH > 7.25")
        elif abg.paco2 < 35:
            analysis_parts.append("Hypocapnia (PaCO2 < 35 mmHg)")
        
        if not recommendations:
            recommendations.append("Current settings appear appropriate - continue monitoring")
        
        analysis = ". ".join(analysis_parts) + "."
        rationale = "Based on ARDSnet low tidal volume ventilation protocol and lung-protective strategies."
        
        return AIConsultResponse(
            analysis=analysis,
            recommendations=recommendations,
            rationale=rationale
        )
    
    async def get_consultation(self, abg: ABGValues) -> AIConsultResponse:
        """
        Get AI consultation based on ABG values.
        
        Args:
            abg: Arterial blood gas values
            
        Returns:
            Clinical analysis and recommendations
        """
        if not self.client:
            # Use mock response if no API key
            return self._get_mock_response(abg)
        
        try:
            # Construct prompt for OpenAI
            system_prompt = """You are a Critical Care Specialist with expertise in mechanical ventilation and ARDS management.
Analyze the provided Arterial Blood Gas (ABG) values and current ventilator settings.
Based on the ARDSnet protocol and lung-protective ventilation strategies, provide:
1. Clinical analysis of the ABG values
2. Specific recommendations for ventilator adjustments (PEEP, FiO2, etc.)
3. Medical rationale for your recommendations

Respond in JSON format with keys: analysis, recommendations (array), rationale."""

            user_prompt = f"""Patient ABG Values:
- pH: {abg.ph}
- PaCO2: {abg.paco2} mmHg
- PaO2: {abg.pao2} mmHg

Current Ventilator Settings:
- FiO2: {abg.fio2 * 100:.0f}%
- PEEP: {abg.peep} cmH2O

Please provide your clinical assessment and recommendations."""

            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            # Parse response
            import json
            result = json.loads(response.choices[0].message.content)
            
            return AIConsultResponse(
                analysis=result.get("analysis", "Analysis not available"),
                recommendations=result.get("recommendations", []),
                rationale=result.get("rationale", "Rationale not provided")
            )
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            # Fallback to mock response
            return self._get_mock_response(abg)
