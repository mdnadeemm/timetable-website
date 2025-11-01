"""
Test script for ADK Agent
Run this to verify the agent is working correctly
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

def test_imports():
    """Test that all required imports work"""
    print("Testing imports...")
    try:
        from adk_agent import (
            timetable_agent,
            chat_with_agent,
            generate_learning_plan_tool,
            suggest_study_schedule_tool,
            analyze_learning_progress_tool,
            get_learning_resources_tool
        )
        print("✓ All imports successful")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        print("\nNote: If google-adk is not installed, run: pip install google-adk")
        return False

def test_learning_plan_tool():
    """Test the learning plan generation tool"""
    print("\nTesting learning plan generation...")
    try:
        from adk_agent import generate_learning_plan_tool
        
        result = generate_learning_plan_tool(
            skill="Python Programming",
            duration_weeks=2,
            hours_per_week=8,
            difficulty="beginner"
        )
        
        if result.get("success"):
            print("✓ Learning plan generated successfully")
            plan = result.get("plan")
            print(f"  - Skill: {plan.get('skill')}")
            print(f"  - Total weeks: {plan.get('totalWeeks')}")
            print(f"  - Weekly plans: {len(plan.get('weeklyPlans', []))}")
            return True
        else:
            print(f"✗ Failed: {result.get('message')}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_schedule_tool():
    """Test the schedule suggestion tool"""
    print("\nTesting schedule suggestion...")
    try:
        from adk_agent import suggest_study_schedule_tool
        
        result = suggest_study_schedule_tool(
            available_hours=10,
            preferred_days=["Monday", "Wednesday", "Friday"],
            time_preference="morning"
        )
        
        if result.get("success"):
            print("✓ Schedule generated successfully")
            print(f"  - Sessions per week: {result.get('sessionsPerWeek')}")
            print(f"  - Total hours: {result.get('totalHours')}")
            schedule = result.get('schedule', [])
            if schedule:
                first = schedule[0]
                print(f"  - First session: {first['dayName']} {first['startTime']}-{first['endTime']}")
            return True
        else:
            print(f"✗ Failed: {result.get('message')}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_progress_tool():
    """Test the progress analysis tool"""
    print("\nTesting progress analysis...")
    try:
        from adk_agent import analyze_learning_progress_tool
        
        result = analyze_learning_progress_tool(
            completed_sessions=15,
            total_sessions=40,
            current_week=2,
            total_weeks=8
        )
        
        if result.get("success"):
            print("✓ Progress analyzed successfully")
            print(f"  - Completion rate: {result.get('completionRate')}%")
            print(f"  - Status: {result.get('status')}")
            print(f"  - On track: {result.get('onTrack')}")
            recommendations = result.get('recommendations', [])
            if recommendations:
                print(f"  - Recommendations: {len(recommendations)}")
            return True
        else:
            print(f"✗ Failed: {result.get('message')}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_resources_tool():
    """Test the learning resources tool"""
    print("\nTesting learning resources...")
    try:
        from adk_agent import get_learning_resources_tool
        
        result = get_learning_resources_tool(
            skill="JavaScript",
            topic="Async Programming",
            resource_type="all"
        )
        
        if result.get("success"):
            print("✓ Resources retrieved successfully")
            print(f"  - Resource count: {result.get('count')}")
            return True
        else:
            print(f"✗ Failed: {result.get('message')}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_agent_initialization():
    """Test that the agent initializes correctly"""
    print("\nTesting agent initialization...")
    try:
        from adk_agent import timetable_agent
        
        print("✓ Agent initialized")
        if hasattr(timetable_agent, 'name'):
            print(f"  - Name: {timetable_agent.name}")
        if hasattr(timetable_agent, 'model'):
            print(f"  - Model: {timetable_agent.model}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_environment():
    """Test environment configuration"""
    print("\nTesting environment configuration...")
    api_key = os.getenv('GOOGLE_AI_API_KEY')
    
    if not api_key:
        print("✗ GOOGLE_AI_API_KEY not found in environment")
        print("  Please create a .env file with GOOGLE_AI_API_KEY=your_key")
        return False
    
    if api_key == 'your_api_key_here':
        print("✗ GOOGLE_AI_API_KEY is set to placeholder value")
        print("  Please set a valid API key in .env file")
        return False
    
    print("✓ Environment configured correctly")
    print(f"  - API Key: {api_key[:10]}...{api_key[-4:]}")
    return True

def main():
    """Run all tests"""
    print("=" * 60)
    print("ADK Agent Test Suite")
    print("=" * 60)
    
    results = []
    
    # Test environment first
    results.append(("Environment", test_environment()))
    
    # Test imports
    results.append(("Imports", test_imports()))
    
    # Only continue if imports work
    if not results[-1][1]:
        print("\n" + "=" * 60)
        print("Cannot continue testing without successful imports")
        print("=" * 60)
        return
    
    # Test agent initialization
    results.append(("Agent Init", test_agent_initialization()))
    
    # Test tools
    results.append(("Schedule Tool", test_schedule_tool()))
    results.append(("Progress Tool", test_progress_tool()))
    
    # These require API calls
    print("\n" + "-" * 60)
    print("Testing tools that require API calls (may take a moment)...")
    print("-" * 60)
    
    results.append(("Learning Plan Tool", test_learning_plan_tool()))
    results.append(("Resources Tool", test_resources_tool()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print("-" * 60)
    print(f"Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 All tests passed! The ADK agent is ready to use.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the errors above.")

if __name__ == "__main__":
    main()

